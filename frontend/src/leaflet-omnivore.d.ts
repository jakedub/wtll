declare module '@mapbox/leaflet-omnivore'{
    import * as L from 'leaflet';
    interface Omnivore {
        kml(url: string, options?: L.KmlOptions): L.Layer;
        gpx(url: string, options?: L.GpxOptions): L.Layer;
        csv(url: string, options?: L.CsvOptions): L.Layer;
        topojson(url: string, options?: L.TopoJSONOptions): L.Layer;
        geojson(url: string, options?: L.GeoJSONOptions): L.Layer;
    }
    const omnivore: Omnivore;
    export = omnivore;
}