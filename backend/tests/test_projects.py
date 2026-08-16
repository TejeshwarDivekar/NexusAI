def test_project_lifecycle_and_questions(client):
    # 1. Create a Project
    proj_payload = {
        "title": "Quantum Computing & Post-Quantum Cryptography",
        "description": "Investigating lattice-based cryptographic resilience against Shor's algorithm.",
        "questions": [
            {
                "question_text": "What is the security margin of Kyber-512 against quantum attacks?",
                "objectives": ["Analyze lattice attacks", "Review NIST standard specifications"]
            }
        ]
    }
    create_res = client.post("/api/v1/projects/", json=proj_payload)
    assert create_res.status_code == 201
    proj = create_res.json()
    proj_id = proj["id"]
    assert proj["title"] == proj_payload["title"]
    assert len(proj["questions"]) == 1

    # 2. List Projects
    list_res = client.get("/api/v1/projects/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Add Another Research Question
    q_payload = {
        "question_text": "How does Dilithium perform compared to Falcon on embedded microcontrollers?",
        "objectives": ["Measure memory consumption", "Calculate signature sizes"]
    }
    q_res = client.post(f"/api/v1/projects/{proj_id}/questions", json=q_payload)
    assert q_res.status_code == 201
    assert q_res.json()["project_id"] == proj_id

    # 4. Get Project Detail
    detail_res = client.get(f"/api/v1/projects/{proj_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["questions"]) == 2

    # 5. Delete Project
    del_res = client.delete(f"/api/v1/projects/{proj_id}")
    assert del_res.status_code == 200

    # 6. Verify 404 after deletion
    not_found = client.get(f"/api/v1/projects/{proj_id}")
    assert not_found.status_code == 404
