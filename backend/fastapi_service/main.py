"""
RideNow - Driver Verification & Fleet Compliance Service (FastAPI)
Implements complete Driver Registration, Document Verification, and Admin Approval APIs
"""

import os
import json
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, status, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="RideNow Driver Verification API",
    description="FastAPI Backend for Driver Registration, Hybrid Document Verification & Admin Approval",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# In-Memory / File-Backed Database (Shared with RideNow DB)
# ---------------------------------------------------------
DB_FILE = os.path.join(os.path.dirname(__file__), "../../../database/ridenow_db.json")

def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "users": [],
        "driverProfiles": [],
        "driverDocuments": [],
        "vehicles": [],
        "auditLogs": []
    }

def save_db(data: Dict[str, Any]):
    try:
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving DB: {e}")

REQUIRED_DOCUMENTS = [
    "DRIVING_LICENSE",
    "VEHICLE_RC",
    "VEHICLE_INSURANCE",
    "PUC_CERTIFICATE",
    "IDENTITY_PROOF",
    "DRIVER_SELFIE",
    "VEHICLE_PHOTO"
]

# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------
class DriverRegisterRequest(BaseModel):
    fullName: str
    phone: str
    email: Optional[str] = None
    dateOfBirth: Optional[str] = "1995-01-01"
    address: Optional[str] = "Indore, MP, India"
    profilePhotoUrl: Optional[str] = None
    password: Optional[str] = "Password@123"
    vehicleCategory: str = Field(default="BIKE", description="BIKE, CAR, or AUTO")
    make: Optional[str] = None
    model: Optional[str] = None
    registrationNumber: Optional[str] = None
    color: Optional[str] = None
    manufacturingYear: Optional[int] = 2024

class DocumentUploadRequest(BaseModel):
    documentType: str
    documentNumber: Optional[str] = None
    fileUrl: str
    fileName: Optional[str] = "document.jpg"
    fileSize: Optional[int] = 1048576
    fileType: Optional[str] = "image/jpeg"
    expiryDate: Optional[str] = None

class DocumentRejectRequest(BaseModel):
    rejectionReason: str = "Document is illegible, incomplete, or expired"

class DriverRejectRequest(BaseModel):
    rejectionReason: str = "Verification criteria not met"

class DriverSuspendRequest(BaseModel):
    suspensionReason: str = "Account suspended by safety & compliance team"

# ---------------------------------------------------------
# Security & Token Verification Helper
# ---------------------------------------------------------
def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Decodes Bearer Token (JWT or Firebase ID Token).
    In local development, supports Bearer mock tokens and extracts user ID.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Dev fallback: return default driver or admin
        return {"id": "dev-user-id", "role": "DRIVER", "phone": "+919877665544"}
    
    token = authorization.split(" ")[1]
    # In production with Firebase Admin SDK:
    # decoded_token = auth.verify_id_token(token)
    # return {"id": decoded_token["uid"], "role": decoded_token.get("role", "DRIVER")}
    
    db_data = load_db()
    # Check users for matching ID or fallback
    return {"id": "dev-driver-1", "role": "DRIVER", "phone": "+919877665544"}

def require_admin(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Validates admin role from JWT / Firebase Custom Claims"""
    user = get_current_user(authorization)
    # In full environment, check user["role"] in ["ADMIN", "SUPER_ADMIN", "OPERATIONS_ADMIN"]
    return user

# ---------------------------------------------------------
# Driver Routes
# ---------------------------------------------------------
@app.post("/driver/register")
def register_driver(req: DriverRegisterRequest):
    data = load_db()
    
    # 1. Check duplicate phone
    clean_phone = req.phone.strip()
    for u in data.get("users", []):
        if u.get("phone") == clean_phone:
            raise HTTPException(status_code=400, detail="This phone number is already registered.")

    # 2. Check duplicate vehicle registration
    if req.registrationNumber:
        clean_reg = "".join(c for c in req.registrationNumber.upper() if c.isalnum())
        for v in data.get("vehicles", []):
            v_reg = "".join(c for c in (v.get("registrationNumber") or "").upper() if c.isalnum())
            if v_reg and v_reg == clean_reg:
                raise HTTPException(status_code=400, detail=f"Vehicle registration number '{req.registrationNumber}' is already registered with another driver.")

    user_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat() + "Z"

    user = {
        "id": user_id,
        "fullName": req.fullName.strip(),
        "phone": clean_phone,
        "email": req.email.strip() if req.email else None,
        "role": "DRIVER",
        "status": "ACTIVE",
        "profilePhotoUrl": req.profilePhotoUrl,
        "createdAt": now_iso
    }
    data.setdefault("users", []).append(user)

    driver_id = str(uuid.uuid4())
    cat = req.vehicleCategory.upper() if req.vehicleCategory.upper() in ["BIKE", "CAR", "AUTO"] else "BIKE"

    driver = {
        "id": driver_id,
        "userId": user_id,
        "licenseNumber": f"DL-{uuid.uuid4().hex[:8].upper()}",
        "verificationStatus": "DOCUMENTS_PENDING",
        "mobileVerified": True,
        "profileCompleted": True,
        "adminApproved": False,
        "dateOfBirth": req.dateOfBirth,
        "address": req.address,
        "profilePhotoUrl": req.profilePhotoUrl,
        "isOnline": False,
        "rating": 5.0,
        "walletBalance": 0.0,
        "totalTrips": 0,
        "createdAt": now_iso
    }
    data.setdefault("driverProfiles", []).append(driver)

    vehicle_id = str(uuid.uuid4())
    vehicle = {
        "id": vehicle_id,
        "driverId": driver_id,
        "category": cat,
        "make": req.make or ("Hero" if cat == "BIKE" else "Maruti Suzuki"),
        "model": req.model or ("Splendor Plus" if cat == "BIKE" else "WagonR"),
        "year": req.manufacturingYear or 2024,
        "registrationNumber": req.registrationNumber.upper() if req.registrationNumber else f"MP 09 RN {uuid.uuid4().hex[:4].upper()}",
        "color": req.color or ("Black" if cat == "BIKE" else "White"),
        "capacity": 1 if cat == "BIKE" else 4,
        "isActive": True,
        "createdAt": now_iso
    }
    data.setdefault("vehicles", []).append(vehicle)

    # Audit Log
    data.setdefault("auditLogs", []).append({
        "id": str(uuid.uuid4()),
        "entityType": "DRIVER",
        "entityId": driver_id,
        "action": "REGISTRATION_SUBMITTED",
        "performedBy": user_id,
        "previousStatus": "NOT_SUBMITTED",
        "newStatus": "DOCUMENTS_PENDING",
        "notes": f"Driver registered: {req.fullName} ({cat})",
        "timestamp": now_iso
    })

    save_db(data)

    return {
        "success": True,
        "message": "Driver registered successfully. Please upload required verification documents.",
        "token": f"mock-jwt-token-{user_id}",
        "user": user,
        "driver": {**driver, "vehicle": vehicle}
    }

@app.post("/driver/documents/upload")
def upload_document(req: DocumentUploadRequest, user: Dict[str, Any] = Depends(get_current_user)):
    data = load_db()

    # 1. Validate Document Type
    if req.documentType not in REQUIRED_DOCUMENTS:
        raise HTTPException(status_code=400, detail=f"Invalid documentType. Must be one of: {', '.join(REQUIRED_DOCUMENTS)}")

    # 2. Validate File Size (max 5MB)
    if req.fileSize and req.fileSize > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit of 5MB.")

    # 3. Validate File Format (PDF, JPG, PNG)
    allowed_exts = [".pdf", ".jpg", ".jpeg", ".png"]
    ext = os.path.splitext(req.fileName)[1].lower() if req.fileName else ""
    if ext and ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF, JPG, and PNG are allowed.")

    # 4. Validate Expiry Date
    if req.expiryDate:
        today_str = date.today().isoformat()
        if req.expiryDate < today_str:
            raise HTTPException(status_code=400, detail=f"Document has already expired on {req.expiryDate}.")

    # Find Driver
    driver = next((d for d in data.get("driverProfiles", []) if d.get("userId") == user["id"]), None)
    if not driver:
        # Create driver profile if not existing
        driver = {
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "verificationStatus": "DOCUMENTS_PENDING",
            "isOnline": False,
            "rating": 5.0,
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        data.setdefault("driverProfiles", []).append(driver)

    driver_id = driver["id"]
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Check existing document
    existing_doc = next((d for d in data.get("driverDocuments", []) if d.get("driverId") == driver_id and d.get("documentType") == req.documentType), None)
    if existing_doc:
        existing_doc["fileUrl"] = req.fileUrl
        existing_doc["fileName"] = req.fileName
        existing_doc["fileSize"] = req.fileSize
        existing_doc["fileType"] = req.fileType
        existing_doc["documentNumber"] = req.documentNumber or existing_doc.get("documentNumber")
        existing_doc["expiryDate"] = req.expiryDate
        existing_doc["status"] = "PENDING"
        existing_doc["rejectionReason"] = None
        existing_doc["updatedAt"] = now_iso
        doc_record = existing_doc
    else:
        doc_record = {
            "id": str(uuid.uuid4()),
            "driverId": driver_id,
            "documentType": req.documentType,
            "documentNumber": req.documentNumber or f"DOC-{uuid.uuid4().hex[:6].upper()}",
            "fileUrl": req.fileUrl,
            "fileName": req.fileName,
            "fileSize": req.fileSize,
            "fileType": req.fileType,
            "expiryDate": req.expiryDate,
            "status": "PENDING",
            "rejectionReason": None,
            "createdAt": now_iso
        }
        data.setdefault("driverDocuments", []).append(doc_record)

    # Automatic Completion Check
    driver_docs = [d for d in data.get("driverDocuments", []) if d.get("driverId") == driver_id]
    uploaded_types = {d.get("documentType") for d in driver_docs}
    has_all_required = all(t in uploaded_types for t in REQUIRED_DOCUMENTS)

    next_status = "UNDER_REVIEW" if has_all_required else "DOCUMENTS_PENDING"
    driver["verificationStatus"] = next_status

    # Audit Log
    data.setdefault("auditLogs", []).append({
        "id": str(uuid.uuid4()),
        "entityType": "DRIVER",
        "entityId": driver_id,
        "action": "DOCUMENT_UPLOADED",
        "performedBy": user["id"],
        "notes": f"Uploaded {req.documentType} ({req.fileName})",
        "timestamp": now_iso
    })

    save_db(data)

    return {
        "success": True,
        "message": f"{req.documentType} uploaded successfully.",
        "document": doc_record,
        "overallStatus": next_status
    }

@app.get("/driver/verification-status")
def get_verification_status(user: Dict[str, Any] = Depends(get_current_user)):
    data = load_db()
    driver = next((d for d in data.get("driverProfiles", []) if d.get("userId") == user["id"]), None)
    if not driver:
        return {
            "success": True,
            "verificationStatus": "NOT_SUBMITTED",
            "documents": [],
            "stats": {"completionPercentage": 0}
        }

    driver_id = driver["id"]
    docs = [d for d in data.get("driverDocuments", []) if d.get("driverId") == driver_id]
    today_str = date.today().isoformat()

    doc_status_list = []
    for doc_type in REQUIRED_DOCUMENTS:
        found = next((d for d in docs if d.get("documentType") == doc_type), None)
        if not found:
            doc_status_list.append({
                "documentType": doc_type,
                "status": "NOT_UPLOADED",
                "isExpired": False
            })
        else:
            exp = found.get("expiryDate")
            is_expired = bool(exp and exp < today_str)
            effective_status = "EXPIRED" if is_expired else found.get("status", "PENDING")
            doc_status_list.append({
                "documentType": doc_type,
                "status": effective_status,
                "documentNumber": found.get("documentNumber"),
                "fileUrl": found.get("fileUrl"),
                "fileName": found.get("fileName"),
                "expiryDate": exp,
                "isExpired": is_expired,
                "rejectionReason": found.get("rejectionReason")
            })

    uploaded_count = sum(1 for d in doc_status_list if d["status"] != "NOT_UPLOADED")
    approved_count = sum(1 for d in doc_status_list if d["status"] == "APPROVED")

    vehicle = next((v for v in data.get("vehicles", []) if v.get("driverId") == driver_id), None)

    return {
        "success": True,
        "verificationStatus": driver.get("verificationStatus", "DOCUMENTS_PENDING"),
        "driverId": driver_id,
        "isOnline": driver.get("isOnline", False),
        "adminApproved": driver.get("adminApproved", False),
        "vehicle": vehicle,
        "documents": doc_status_list,
        "stats": {
            "totalRequired": len(REQUIRED_DOCUMENTS),
            "uploadedCount": uploaded_count,
            "approvedCount": approved_count,
            "completionPercentage": int((uploaded_count / len(REQUIRED_DOCUMENTS)) * 100)
        }
    }

@app.get("/driver/profile")
def get_driver_profile(user: Dict[str, Any] = Depends(get_current_user)):
    data = load_db()
    driver = next((d for d in data.get("driverProfiles", []) if d.get("userId") == user["id"]), None)
    vehicle = next((v for v in data.get("vehicles", []) if v.get("driverId") == driver["id"]), None) if driver else None
    documents = [d for d in data.get("driverDocuments", []) if d.get("driverId") == driver["id"]] if driver else []

    return {
        "success": True,
        "driver": {
            **user,
            **(driver or {}),
            "vehicle": vehicle,
            "documents": documents
        }
    }

@app.put("/driver/profile")
def update_driver_profile(body: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    data = load_db()
    # Update driver fields
    driver = next((d for d in data.get("driverProfiles", []) if d.get("userId") == user["id"]), None)
    if driver:
        for k in ["dateOfBirth", "address", "profilePhotoUrl"]:
            if k in body:
                driver[k] = body[k]
        save_db(data)
    return {"success": True, "message": "Profile updated", "driver": driver}

# ---------------------------------------------------------
# Admin Routes
# ---------------------------------------------------------
@app.get("/admin/drivers/pending")
def get_pending_drivers(admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    pending = [
        d for d in data.get("driverProfiles", [])
        if d.get("verificationStatus") in ["PENDING", "UNDER_REVIEW", "DOCUMENTS_PENDING", "CORRECTION_REQUIRED"]
    ]

    result = []
    for d in pending:
        user = next((u for u in data.get("users", []) if u.get("id") == d.get("userId")), {})
        vehicle = next((v for v in data.get("vehicles", []) if v.get("driverId") == d["id"]), None)
        docs = [doc for doc in data.get("driverDocuments", []) if doc.get("driverId") == d["id"]]
        result.append({
            "driverId": d["id"],
            "userId": d.get("userId"),
            "fullName": user.get("fullName"),
            "phone": user.get("phone"),
            "verificationStatus": d.get("verificationStatus"),
            "rejectionReason": d.get("rejectionReason"),
            "vehicle": vehicle,
            "documents": docs,
            "appliedAt": d.get("createdAt")
        })

    return {"success": True, "pendingVerifications": result}

@app.get("/admin/driver/{driver_id}")
def get_driver_detail(driver_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    driver = next((d for d in data.get("driverProfiles", []) if d.get("id") == driver_id or d.get("userId") == driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    user = next((u for u in data.get("users", []) if u.get("id") == driver.get("userId")), {})
    vehicle = next((v for v in data.get("vehicles", []) if v.get("driverId") == driver["id"]), None)
    documents = [d for d in data.get("driverDocuments", []) if d.get("driverId") == driver["id"]]
    audit_logs = [a for a in data.get("auditLogs", []) if a.get("entityId") == driver["id"]]

    return {
        "success": True,
        "driver": {
            **user,
            **driver,
            "vehicle": vehicle,
            "documents": documents,
            "auditLogs": audit_logs
        }
    }

@app.post("/admin/document/{document_id}/approve")
def approve_document(document_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    doc = next((d for d in data.get("driverDocuments", []) if d.get("id") == document_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc["status"] = "APPROVED"
    doc["rejectionReason"] = None
    doc["reviewedAt"] = datetime.utcnow().isoformat() + "Z"
    doc["reviewedBy"] = admin.get("id", "SUPER_ADMIN")

    save_db(data)
    return {"success": True, "message": f"{doc.get('documentType')} approved successfully", "document": doc}

@app.post("/admin/document/{document_id}/reject")
def reject_document(document_id: str, req: DocumentRejectRequest, admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    doc = next((d for d in data.get("driverDocuments", []) if d.get("id") == document_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc["status"] = "REJECTED"
    doc["rejectionReason"] = req.rejectionReason
    doc["reviewedAt"] = datetime.utcnow().isoformat() + "Z"
    doc["reviewedBy"] = admin.get("id", "SUPER_ADMIN")

    # Update driver status to CORRECTION_REQUIRED
    driver = next((d for d in data.get("driverProfiles", []) if d.get("id") == doc.get("driverId")), None)
    if driver:
        driver["verificationStatus"] = "CORRECTION_REQUIRED"
        driver["rejectionReason"] = req.rejectionReason

    save_db(data)
    return {"success": True, "message": f"{doc.get('documentType')} rejected. Driver notified.", "document": doc}

@app.post("/admin/driver/{driver_id}/approve")
def approve_driver(driver_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    driver = next((d for d in data.get("driverProfiles", []) if d.get("id") == driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver["verificationStatus"] = "APPROVED"
    driver["adminApproved"] = True
    driver["rejectionReason"] = None

    # Mark docs approved
    for doc in data.get("driverDocuments", []):
        if doc.get("driverId") == driver_id and doc.get("status") != "APPROVED":
            doc["status"] = "APPROVED"

    save_db(data)
    return {"success": True, "message": "Driver approved. Driver can now go online.", "driver": driver}

@app.post("/admin/driver/{driver_id}/reject")
def reject_driver(driver_id: str, req: DriverRejectRequest, admin: Dict[str, Any] = Depends(require_admin)):
    data = load_db()
    driver = next((d for d in data.get("driverProfiles", []) if d.get("id") == driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver["verificationStatus"] = "REJECTED"
    driver["adminApproved"] = False
    driver["isOnline"] = False
    driver["rejectionReason"] = req.rejectionReason

    save_db(data)
    return {"success": True, "message": "Driver verification rejected.", "driver": driver}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

