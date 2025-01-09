// Layer OpenStreetMap
var peta1 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Layer Stadia Maps Smooth
var peta2 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, ' +
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});

// Layer Stadia Maps Smooth Dark
var peta3 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, ' +
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});

// Inisialisasi peta
const map = L.map('map', {
    center: [5.179748956229851, 97.14093309151546],
    zoom: 13,
    layers: [peta3]
});

// URL untuk GeoServer WFS
var geoServerUrl = 'http://localhost:8080/geoserver/perkebunanwebgis/wfs';
var geoJsonUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=perkebunanwebgis:arenaolahraga_pt_50k&outputFormat=application/json&srsName=EPSG:4326`;

// Menampilkan data GeoJSON ke peta dengan popup berisi tombol hapus
$.getJSON(geoJsonUrl).then(res => {
    var layer = L.geoJson(res, {
        onEachFeature: function (feature, layer) {
            var popupContent = `
                <h3>${feature.properties.namobj}</h3>
                <p>Arena olahraga: ${feature.properties.remark}</p>
                <button id="deleteFeature-${feature.id}" data-fid="${feature.id}" style="color: white; background-color: red; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">
                    Hapus Data
                </button>
            `;

            layer.bindPopup(popupContent);

            layer.on("popupopen", function () {
                var deleteButton = document.getElementById(`deleteFeature-${feature.id}`);
                if (deleteButton) {
                    deleteButton.addEventListener("click", function () {
                        var featureId = this.getAttribute("data-fid");

                        if (!featureId) {
                            alert("Feature ID tidak ditemukan.");
                            return;
                        }

                        // Payload WFS-T untuk menghapus data
                        var deleteTransaction = `
                            <wfs:Transaction service="WFS" version="1.0.0"
                              xmlns:wfs="http://www.opengis.net/wfs"
                              xmlns:ogc="http://www.opengis.net/ogc"
                              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                              xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd">
                              <wfs:Delete typeName="perkebunanwebgis:arenaolahraga_pt_50k">
                                <ogc:Filter>
                                  <ogc:FeatureId fid="${featureId}" />
                                </ogc:Filter>
                              </wfs:Delete>
                            </wfs:Transaction>`;

                        // AJAX request ke GeoServer
                        $.ajax({
                            url: geoServerUrl,
                            type: 'POST',
                            contentType: 'text/xml',
                            data: deleteTransaction,
                            success: function (response) {
                                console.log("Response dari GeoServer:", response);
                                alert("Objek berhasil dihapus dari GeoServer");
                                map.removeLayer(layer); // Hapus layer dari peta
                            },
                            error: function (xhr, status, error) {
                                console.error("Gagal menghapus data dari GeoServer:", xhr.responseText);
                                alert("Gagal menghapus data. Periksa konsol untuk informasi lebih lanjut.");
                            }
                        });
                    });
                }
            });
        }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
});
