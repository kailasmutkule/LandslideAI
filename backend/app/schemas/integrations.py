from pydantic import BaseModel, Field, model_validator


class OverpassQuery(BaseModel):

    south: float = Field(ge=-90, le=90)

    west: float = Field(ge=-180, le=180)

    north: float = Field(ge=-90, le=90)

    east: float = Field(ge=-180, le=180)

    highway_types: list[str] = [
        "primary",
        "secondary",
        "tertiary",
        "trunk"
    ]

    @model_validator(mode="after")
    def validate_bbox(self):
        if self.north <= self.south:
            raise ValueError("north must be greater than south")

        if self.east <= self.west:
            raise ValueError("east must be greater than west")

        return self


class GoogleMapsRouteRequest(BaseModel):

    start_lat: float = Field(ge=-90, le=90)

    start_lon: float = Field(ge=-180, le=180)

    destination_lat: float = Field(ge=-90, le=90)

    destination_lon: float = Field(ge=-180, le=180)