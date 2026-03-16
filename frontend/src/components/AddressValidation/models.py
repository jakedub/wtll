from . import db

class GeocodeResult(db.Model):
    __tablename__ = 'geocode_results'

    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False, unique=True, index=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    in_district = db.Column(db.Boolean, nullable=True)

    def to_dict(self):
        return {
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'in_district': self.in_district,
        }