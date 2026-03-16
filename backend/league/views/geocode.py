from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from league.services.geocoding import geocode_single_address

class GeocodeView(APIView):
    """
    Handles GET /api/geocode/?address=...
    """
    def get(self, request, *args, **kwargs):
        address = request.query_params.get('address')
        if not address:
            return Response({"error": "No address provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lat, lng, error = geocode_single_address(address)
            if error:
                return Response({
                    "address": address,
                    "status": "FAILED",
                    "reason": error
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "address": address,
                "latitude": lat,
                "longitude": lng,
                "status": "SUCCESS"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Geocoding failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)