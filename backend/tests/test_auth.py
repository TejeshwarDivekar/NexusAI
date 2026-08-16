import pytest


def test_successful_registration(client):
    """Test 1: Successful user registration returns JWT token and sanitized profile."""
    reg_payload = {
        "email": "dr_watson@laboratory.org",
        "username": "DrWatson",
        "password": "WatsonSecure2026!",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"
    assert data["user"]["email"] == reg_payload["email"]
    assert data["user"]["username"] == reg_payload["username"]
    # Security requirement: Never expose password hashes or plaintext in responses
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]


def test_duplicate_registration(client):
    """Test 2: Duplicate registration with the same email fails gracefully."""
    reg_payload = {
        "email": "curie@radium.org",
        "username": "MarieCurie",
        "password": "Discovery2026!",
    }
    # Initial registration
    first_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert first_res.status_code == 200

    # Duplicate attempt
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    err_data = dup_res.json()
    assert "detail" in err_data or "error" in err_data


def test_successful_login(client):
    """Test 3: Successful login with valid credentials yields valid token."""
    # Register user first
    user_payload = {
        "email": "feynman@physics.edu",
        "username": "RichardFeynman",
        "password": "QuantumMechanics101!",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 200

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": user_payload["email"], "password": user_payload["password"]},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == user_payload["email"]


def test_invalid_credentials(client):
    """Test 4: Login with incorrect password or non-existent email returns 401."""
    # User exists, wrong password
    user_payload = {
        "email": "turing@bletchley.ac.uk",
        "username": "AlanTuring",
        "password": "EnigmaCracked1942!",
    }
    client.post("/api/v1/auth/register", json=user_payload)

    bad_pass_res = client.post(
        "/api/v1/auth/login",
        json={"email": user_payload["email"], "password": "WrongPassword999!"},
    )
    assert bad_pass_res.status_code == 401

    # Non-existent user
    non_existent_res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@nonexistent.org", "password": "AnyPassword123!"},
    )
    assert non_existent_res.status_code == 401


def test_protected_endpoint_without_authentication(client):
    """Test 5: Accessing protected /me without Authorization header returns 401."""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_authenticated_access(client):
    """Test 6: Accessing protected endpoint with valid Bearer token returns 200."""
    user_payload = {
        "email": "ada@computing.org",
        "username": "AdaLovelace",
        "password": "FirstProgrammer1843!",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    token = reg_res.json()["access_token"]

    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == user_payload["email"]
    assert profile["username"] == user_payload["username"]


def test_cross_user_resource_access_attempt(client):
    """Test 7: Cross-user resource access attempt is strictly blocked (403 Forbidden)."""
    # 1. Register User A and create User A's private research project
    user_a = {
        "email": "user_a@research.org",
        "username": "UserAlpha",
        "password": "PasswordA123!",
    }
    res_a = client.post("/api/v1/auth/register", json=user_a)
    token_a = res_a.json()["access_token"]

    proj_res = client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "title": "User A Private Gene Sequence Analysis",
            "description": "Proprietary research dataset",
        },
    )
    assert proj_res.status_code == 201
    project_id = proj_res.json()["id"]

    # 2. Register User B
    user_b = {
        "email": "user_b@competitor.org",
        "username": "UserBeta",
        "password": "PasswordB456!",
    }
    res_b = client.post("/api/v1/auth/register", json=user_b)
    token_b = res_b.json()["access_token"]

    # 3. User B attempts to GET User A's project -> Must be rejected with 403 Forbidden
    unauthorized_get = client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert unauthorized_get.status_code == 403

    # 4. User B attempts to MODIFY User A's project -> Must be rejected with 403 Forbidden
    unauthorized_patch = client.patch(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"title": "Hacked Title by User B"},
    )
    assert unauthorized_patch.status_code == 403

    # 5. User B attempts to DELETE User A's project -> Must be rejected with 403 Forbidden
    unauthorized_delete = client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert unauthorized_delete.status_code == 403

    # 6. Verify User A can still access their project cleanly
    authorized_get = client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert authorized_get.status_code == 200
    assert authorized_get.json()["title"] == "User A Private Gene Sequence Analysis"
