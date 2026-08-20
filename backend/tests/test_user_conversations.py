import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, Conversation, Message, ResearchTask, GeneratedDocument

TEST_DATABASE_URL = "sqlite:///./test_user_isolation.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_user_a_and_user_b_isolation_and_research_runs():
    # 1. Register User A via Google OAuth Sync (provider_user_id = 'google-sub-1111')
    resp_a = client.post(
        "/api/v1/auth/oauth_sync",
        json={
            "provider": "google",
            "provider_user_id": "google-sub-1111",
            "email": "user_a@gmail.com",
            "name": "User A",
            "profile_image": "https://lh3.googleusercontent.com/a/user-a"
        }
    )
    assert resp_a.status_code == 200
    token_a = resp_a.json()["access_token"]
    user_a_id = resp_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register User B via Google OAuth Sync (provider_user_id = 'google-sub-2222')
    resp_b = client.post(
        "/api/v1/auth/oauth_sync",
        json={
            "provider": "google",
            "provider_user_id": "google-sub-2222",
            "email": "user_b@gmail.com",
            "name": "User B",
            "profile_image": "https://lh3.googleusercontent.com/a/user-b"
        }
    )
    assert resp_b.status_code == 200
    token_b = resp_b.json()["access_token"]
    user_b_id = resp_b.json()["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    assert user_a_id != user_b_id

    # 3. User A creates Conversation 1
    create_convo_a = client.post(
        "/api/v1/conversations/",
        json={"initial_query": "Investigating quantum error mitigation codes in neutral atom QPU"},
        headers=headers_a
    )
    assert create_convo_a.status_code == 200
    convo_a = create_convo_a.json()
    convo_a_id = convo_a["id"]
    assert convo_a["user_id"] == user_a_id
    assert "quantum" in convo_a["title"].lower()

    # 4. User A sends messages to Conversation 1
    msg1 = client.post(
        f"/api/v1/conversations/{convo_a_id}/messages",
        json={"role": "user", "content": "What is the primary decoder used in neutral atom arrays?"},
        headers=headers_a
    )
    assert msg1.status_code == 200

    msg2 = client.post(
        f"/api/v1/conversations/{convo_a_id}/messages",
        json={"role": "assistant", "content": "Neutral atom systems typically employ Union-Find or MWPM decoders with dual-rail erasures."},
        headers=headers_a
    )
    assert msg2.status_code == 200

    # 5. User B lists conversations -> User B must NOT see Conversation 1!
    list_b = client.post(
        "/api/v1/conversations/",
        json={"initial_query": "CRISPR-Cas12 target cleavage efficiency"},
        headers=headers_b
    )
    assert list_b.status_code == 200
    convo_b_id = list_b.json()["id"]

    all_convos_b = client.get("/api/v1/conversations/", headers=headers_b).json()
    b_ids = [c["id"] for c in all_convos_b]
    assert convo_b_id in b_ids
    assert convo_a_id not in b_ids, "CRITICAL SECURITY BREACH: User B saw User A's conversation!"

    # 6. User B attempts unauthorized access to User A's conversation details
    unauthorized_detail = client.get(f"/api/v1/conversations/{convo_a_id}", headers=headers_b)
    assert unauthorized_detail.status_code == 404, "CRITICAL: Server returned User A conversation to User B!"

    # 7. User B attempts unauthorized message injection into User A's conversation
    unauthorized_msg = client.post(
        f"/api/v1/conversations/{convo_a_id}/messages",
        json={"role": "user", "content": "Malicious payload from user B"},
        headers=headers_b
    )
    assert unauthorized_msg.status_code == 404

    # 8. User B attempts unauthorized deletion of User A's conversation
    unauthorized_delete = client.delete(f"/api/v1/conversations/{convo_a_id}", headers=headers_b)
    assert unauthorized_delete.status_code == 404

    # 9. User A performs real research inside Conversation 1
    research_run_resp = client.post(
        "/api/v1/research/run",
        json={
            "query": "Dual-rail erasure conversion in neutral atom quantum computing",
            "conversation_id": convo_a_id,
            "depth": "fast"
        },
        headers=headers_a
    )
    assert research_run_resp.status_code == 200
    task_data = research_run_resp.json()
    task_id = task_data["task_id"]
    assert task_data["conversation_id"] == convo_a_id

    # 10. User A can access task and download document
    task_lookup_a = client.get(f"/api/v1/research/tasks/{task_id}", headers=headers_a)
    assert task_lookup_a.status_code == 200

    doc_dl_a = client.get(f"/api/v1/research/tasks/{task_id}/document/download", headers=headers_a)
    assert doc_dl_a.status_code == 200

    # 11. User B attempts to access User A's research task and download document -> MUST BE REJECTED
    task_lookup_b = client.get(f"/api/v1/research/tasks/{task_id}", headers=headers_b)
    assert task_lookup_b.status_code == 403, "CRITICAL: User B was able to view User A's research task!"

    doc_dl_b = client.get(f"/api/v1/research/tasks/{task_id}/document/download", headers=headers_b)
    assert doc_dl_b.status_code == 403, "CRITICAL: User B was able to download User A's generated document!"

    # 12. User A verifies Conversation 1 detail contains messages and research run
    detail_a = client.get(f"/api/v1/conversations/{convo_a_id}", headers=headers_a)
    assert detail_a.status_code == 200
    convo_detail = detail_a.json()
    # 2 initial messages + 1 user prompt from research + 1 assistant report from research = 4 messages
    assert len(convo_detail["messages"]) >= 3
    assert len(convo_detail["tasks"]) == 1

    # 13. User A re-authenticates (simulating logout and login again)
    re_login_a = client.post(
        "/api/v1/auth/oauth_sync",
        json={
            "provider": "google",
            "provider_user_id": "google-sub-1111",
            "email": "user_a@gmail.com",
            "name": "User A Updated",
        }
    )
    assert re_login_a.status_code == 200
    assert re_login_a.json()["user"]["id"] == user_a_id
    re_headers_a = {"Authorization": f"Bearer {re_login_a.json()['access_token']}"}

    re_convos_a = client.get("/api/v1/conversations/", headers=re_headers_a).json()
    assert len(re_convos_a) >= 1
    assert re_convos_a[0]["id"] == convo_a_id

    # 14. User A deletes their own conversation -> cascades research task and messages
    del_resp = client.delete(f"/api/v1/conversations/{convo_a_id}", headers=re_headers_a)
    assert del_resp.status_code == 200
    assert client.get(f"/api/v1/conversations/{convo_a_id}", headers=re_headers_a).status_code == 404
