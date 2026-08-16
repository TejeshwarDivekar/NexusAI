import io
import pytest


def test_document_upload_and_chunking(client):
    file_content = (
        "Neural Architecture Search (NAS) automates neural network design. "
        "Differentiable Architecture Search (DARTS) formulates the search space as continuous relaxation.\n\n"
        "However, DARTS suffers from performance collapse due to excessive parameter sharing. "
        "Recent advances introduce regularization and adaptive temperature annealing to stabilize training."
    )
    
    files = {
        "file": ("research_paper.txt", io.BytesIO(file_content.encode("utf-8")), "text/plain")
    }

    upload_res = client.post("/api/v1/documents/upload", files=files)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["filename"] == "research_paper.txt"
    assert doc_data["chunks_created"] >= 1
    doc_id = doc_data["id"]

    # Retrieve chunks
    chunks_res = client.get(f"/api/v1/documents/{doc_id}/chunks")
    assert chunks_res.status_code == 200
    chunks = chunks_res.json()
    assert len(chunks) >= 1
    assert "DARTS" in chunks[0]["content"]

    # Delete Document
    del_res = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_res.status_code == 200


def test_cross_user_document_isolation(client):
    """Verify that User B cannot access or delete User A's uploaded documents."""
    # 1. Register User A and upload confidential paper
    user_a = {
        "email": "researcher_a@corp.com",
        "username": "UserA",
        "password": "PasswordA123!",
    }
    res_a = client.post("/api/v1/auth/register", json=user_a)
    token_a = res_a.json()["access_token"]

    file_content = "Confidential proprietary patent data on superconductor quantum bits."
    files = {
        "file": ("patent_secret.txt", io.BytesIO(file_content.encode("utf-8")), "text/plain")
    }

    upload_res = client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {token_a}"},
        files=files
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # 2. Register User B
    user_b = {
        "email": "researcher_b@corp.com",
        "username": "UserB",
        "password": "PasswordB456!",
    }
    res_b = client.post("/api/v1/auth/register", json=user_b)
    token_b = res_b.json()["access_token"]

    # 3. User B attempts to access User A's chunks -> 403 Forbidden
    chunks_res = client.get(
        f"/api/v1/documents/{doc_id}/chunks",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert chunks_res.status_code == 403

    # 4. User B attempts to delete User A's document -> 403 Forbidden
    delete_res = client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert delete_res.status_code == 403
