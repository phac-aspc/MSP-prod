# Guidelines

## 1. Run the tileserver-gl-light with the canadian mbtiles
```
tileserver-gl-light canada.mbtiles
```
## 2. change the ip address in index.js (approx. line 620) to be the health-infobase domain
```js
L.vectorGrid.protobuf('http://health-infobase.canada.ca:8080/data/v3/{z}/{x}/{y}.pbf', {
        vectorTileLayerStyles: vectorTileStyling,
        rendererFactory: L.canvas.tile,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    }).addTo(map);
```
## 3. Hopefully this works


