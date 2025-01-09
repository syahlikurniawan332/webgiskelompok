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

// Layer Stadia Maps Satellite
var peta4 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | ' +
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, ' +
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
});

// Inisialisasi peta
const map = L.map('map', {
    // center: [2.100429, 99.827933],
    center: [5.179748956229851, 97.14093309151546],
    zoom: 13,                     // Zoom awal
    layers: [peta1]               // Layer default
});

// Base layers untuk kontrol layer
const baseLayers = {
    "OpenStreetMap": peta1,
    "Stadia Smooth": peta2,
    "Stadia Smooth Dark": peta3,
    "Stadia Satellite": peta4
};

// WMS Layer untuk overlay
var arena = L.tileLayer.wms("http://localhost:8080/geoserver/perkebunanwebgis/wms", {
    layers: "perkebunanwebgis:arenaolahraga_ar_50k",
    transparent: true,
    format: "image/png",
    errorTileUrl: 'https://example.com/error.png' // Tambahkan URL error untuk debugging
});

var arena_1 = L.tileLayer.wms("http://localhost:8080/geoserver/perkebunanwebgis/wms", {
    layers: "perkebunanwebgis:arenaolahraga_pt_50k",
    transparent: true,
    format: "image/png",
    errorTileUrl: 'https://example.com/error.png' // Tambahkan URL error untuk debugging
});

// Overlay layers untuk kontrol layer
const overlayLayers = {     
    "arena": arena,
    "arena_1": arena_1,
};

// Tambahkan kontrol layer ke peta
L.control.layers(baseLayers, overlayLayers, {
    collapsed: false // Pilihan untuk menampilkan menu layer terbuka secara default
}).addTo(map);


var arena_test = 'http://localhost:8080/geoserver/perkebunanwebgis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=perkebunanwebgis%3Aarenaolahraga_pt_50k&maxFeatures=50&outputFormat=application%2Fjson&srsName=epsg:4326';
    
$.getJSON(arena_test).then(res => {
    var layer = L.geoJson(res, {
        onEachFeature: function (feature, layer) {
            // Konten popup dengan tombol Hapus dan Edit
            var popupContent = `
                <h3>${feature.properties.namobj}</h3>
                <p>Arena olahraga: ${feature.properties.remark}</p>
                <button id="deleteFeature" data-fid="${feature.id}" style="color: white; background-color: red; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">
                    Hapus Data
                </button>
                <button id="editFeature" data-fid="${feature.id}" style="color: white; background-color: blue; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">
                    Edit Data
                </button>
            `;

            // Menambahkan popup ke layer
            layer.bindPopup(popupContent);

            // Event listener untuk tombol hapus
            layer.on("popupopen", function () {
                var deleteButton = document.getElementById("deleteFeature");
                var editButton = document.getElementById("editFeature");

                // Fungsi Hapus Data
                if (deleteButton) {
                    deleteButton.addEventListener("click", function () {
                        var featureId = this.getAttribute("data-fid");

                        // Validasi Feature ID
                        if (!featureId) {
                            alert("Feature ID tidak ditemukan. Tidak dapat menghapus objek ini.");
                            return;
                        }

                        // WFS-T request untuk menghapus data
                        var deleteTransaction = `
                            <wfs:Transaction service="WFS" version="1.0.0"
                              xmlns:ogc="http://www.opengis.net/ogc"
                              xmlns:wfs="http://www.opengis.net/wfs"
                              xmlns:perkebunanwebgis="http://www.openplans.org/perkebunanwebgis">
                              <wfs:Delete typeName="perkebunanwebgis:arenaolahraga_pt_50k">
                                <ogc:Filter>
                                  <ogc:FeatureId fid="${featureId}"/>
                                </ogc:Filter>
                              </wfs:Delete>
                            </wfs:Transaction>`;

                        // AJAX request ke GeoServer
                        $.ajax({
                            url: 'http://localhost:8080/geoserver/perkebunanwebgis/wfs',
                            method: 'POST',
                            contentType: 'text/xml',
                            data: deleteTransaction,
                            success: function (response) {
                                alert("Objek berhasil dihapus dari GeoServer");
                                map.removeLayer(layer); // Hapus layer dari peta
                            },
                            error: function (xhr, status, error) {
                                alert("Gagal menghapus objek dari GeoServer");
                            }
                        });
                    });
                }

                // Fungsi Edit Data
                if (editButton) {
                    editButton.addEventListener("click", function () {
                        var featureId = this.getAttribute("data-fid");
                
                        // Tampilkan form edit di popup
                        var editForm = `
                            <h3>Edit Data</h3>
                            <label>Nama Objek:</label>
                            <input id="editName" type="text" value="${feature.properties.namobj}" style="width: 100%; margin-bottom: 10px;" />
                            <label>Remark:</label>
                            <input id="editRemark" type="text" value="${feature.properties.remark}" style="width: 100%; margin-bottom: 10px;" />
                            <button id="saveEdit" style="color: white; background-color: green; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">
                                Simpan Perubahan
                            </button>
                        `;
                
                        layer.setPopupContent(editForm);
                
                        // Pasang event listener untuk tombol Simpan Perubahan setelah konten diperbarui
                        layer.on("popupopen", function () {
                            var saveEditButton = document.getElementById("saveEdit");
                            if (saveEditButton) {
                                saveEditButton.addEventListener("click", function () {
                                    var newName = document.getElementById("editName").value;
                                    var newRemark = document.getElementById("editRemark").value;
                
                                    // Validasi input
                                    if (!newName || !newRemark) {
                                        alert("Semua field harus diisi.");
                                        return;
                                    }
                
                                    // WFS-T request untuk mengedit data
                                    var updateTransaction = `
                                        <wfs:Transaction service="WFS" version="1.0.0"
                                          xmlns:ogc="http://www.opengis.net/ogc"
                                          xmlns:wfs="http://www.opengis.net/wfs"
                                          xmlns:perkebunanwebgis="http://www.openplans.org/perkebunanwebgis">
                                          <wfs:Update typeName="perkebunanwebgis:arenaolahraga_pt_50k">
                                            <wfs:Property>
                                              <wfs:Name>namobj</wfs:Name>
                                              <wfs:Value>${newName}</wfs:Value>
                                            </wfs:Property>
                                            <wfs:Property>
                                              <wfs:Name>remark</wfs:Name>
                                              <wfs:Value>${newRemark}</wfs:Value>
                                            </wfs:Property>
                                            <ogc:Filter>
                                              <ogc:FeatureId fid="${featureId}"/>
                                            </ogc:Filter>
                                          </wfs:Update>
                                        </wfs:Transaction>`;
                
                                    // AJAX request ke GeoServer
                                    $.ajax({
                                        url: 'http://localhost:8080/geoserver/perkebunanwebgis/wfs',
                                        method: 'POST',
                                        contentType: 'text/xml',
                                        data: updateTransaction,
                                        success: function (response) {
                                            alert("Objek berhasil diperbarui di GeoServer");
                                            layer.closePopup(); // Tutup popup setelah menyimpan
                                            feature.properties.namobj = newName;
                                            feature.properties.remark = newRemark;
                                        },
                                        error: function (xhr, status, error) {
                                            alert("Gagal memperbarui objek di GeoServer");
                                        }
                                    });
                                });
                            }
                        });
                
                        layer.openPopup(); // Buka ulang popup untuk memasang event listener
                    });
                }
            });
        }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
});




var drawnItems = new L.FeatureGroup(); // Menampung objek yang digambar
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    draw: {
        polyline: false,    // Nonaktifkan menggambar polyline
        polygon: false,     // Nonaktifkan menggambar polygon
        rectangle: false,   // Nonaktifkan menggambar rectangle
        circle: false,      // Nonaktifkan menggambar circle
        marker: true        // Aktifkan menggambar titik (marker)
    },
    edit: {
        featureGroup: drawnItems,
        remove: true         // Opsi untuk menghapus objek yang digambar
    }
});

map.addControl(drawControl);  // Menambahkan kontrol menggambar ke peta

// Event ketika titik digambar
map.on('draw:created', function(e) {
    var layer = e.layer;
    drawnItems.addLayer(layer); // Menambahkan titik ke layer drawnItems

    // Mendapatkan koordinat dari titik yang digambar
    var latLng = layer.getLatLng();
    var coordinates = latLng.lng + "," + latLng.lat; // Longitude, Latitude

    // Menampilkan form untuk memasukkan nama objek
    var namobj = prompt("Masukkan nama objek:", "Arena Olahraga Kuala");

    if (namobj != null && namobj !== "") {
        // Menyiapkan data XML untuk dikirim ke GeoServer (WFS-T)
        var xmlData = `
            <?xml version="1.0" encoding="UTF-8"?>
            <wfs:Transaction service="WFS" version="1.0.0"
                xmlns:wfs="http://www.opengis.net/wfs"
                xmlns:gml="http://www.opengis.net/gml"
                xmlns:perkebunanwebgis="http://www.openplans.org/perkebunanwebgis">
                <wfs:Insert>
                    <perkebunanwebgis:arenaolahraga_pt_50k>
                        <perkebunanwebgis:namobj>${namobj}</perkebunanwebgis:namobj>
                        <perkebunanwebgis:fcode></perkebunanwebgis:fcode>
                        <perkebunanwebgis:elevas>0E-11</perkebunanwebgis:elevas>
                        <perkebunanwebgis:remark>Titik Referensi</perkebunanwebgis:remark>
                        <perkebunanwebgis:srs_id></perkebunanwebgis:srs_id>
                        <perkebunanwebgis:lcode>GG0020</perkebunanwebgis:lcode>
                        <perkebunanwebgis:metadata></perkebunanwebgis:metadata>
                        <perkebunanwebgis:geom>
                            <gml:MultiPoint srsName="EPSG:4326">
                                <gml:pointMember>
                                    <gml:Point>
                                        <gml:coordinates>${coordinates}</gml:coordinates> <!-- Longitude, Latitude -->
                                    </gml:Point>
                                </gml:pointMember>
                            </gml:MultiPoint>
                        </perkebunanwebgis:geom>
                    </perkebunanwebgis:arenaolahraga_pt_50k>
                </wfs:Insert>
            </wfs:Transaction>`;

        // URL untuk permintaan WFS-T
        var url = 'http://localhost:8080/geoserver/perkebunanwebgis/ows';

        // AJAX request ke GeoServer untuk insert data
        $.ajax({
            url: url, // URL GeoServer
            method: 'POST',
            contentType: 'application/xml', // Mengirimkan data sebagai XML
            data: xmlData, // Data XML yang sudah disiapkan
            success: function(response) {
                alert("Titik berhasil ditambahkan ke GeoServer");
            },
            error: function(xhr, status, error) {
                alert("Gagal menambahkan titik ke GeoServer");
                console.log("Error details:", xhr.responseText);
            }
        });
    } else {
        alert("Nama objek harus diisi!");
    }
});
