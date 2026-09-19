from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import report_service
from fastapi.responses import Response

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/security")
def get_security_report(period: str = 'daily', db: Session = Depends(get_db)):
    return report_service.generate_security_report(db, period)

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    csv_bytes = report_service.export_csv(db, {})
    return Response(content=csv_bytes, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export.csv"})

@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    pdf_bytes = report_service.export_pdf(db, {})
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=report.pdf"})
