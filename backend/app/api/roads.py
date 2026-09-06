from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.road import Road
from app.schemas.road import RoadCreate, RoadOut

router = APIRouter(prefix="/api/roads", tags=["roads"])


@router.post("", response_model=RoadOut, status_code=201)
def create_road(payload: RoadCreate, db: Session = Depends(get_db)):
    road = Road(**payload.model_dump())
    db.add(road)
    db.commit()
    db.refresh(road)
    return road


@router.get("", response_model=list[RoadOut])
def list_roads(db: Session = Depends(get_db)):
    return db.query(Road).order_by(Road.id.desc()).all()


@router.get("/{road_id}", response_model=RoadOut)
def get_road(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    return road


@router.put("/{road_id}", response_model=RoadOut)
def update_road(road_id: int, payload: RoadCreate, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    for key, value in payload.model_dump().items():
        setattr(road, key, value)
    db.commit()
    db.refresh(road)
    return road


@router.delete("/{road_id}")
def delete_road(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    db.delete(road)
    db.commit()
    return {"message": "Road deleted", "id": road_id}
