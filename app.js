(function () {
  const EARTH_RADIUS = 6378137;
  const ALTITUDE_M = 861300;
  const ORBIT_RADIUS = EARTH_RADIUS + ALTITUDE_M;
  const INCLINATION = Cesium.Math.toRadians(98.2);
  const PERIOD_S = 6120;
  const OMEGA = (2 * Math.PI) / PERIOD_S;
  const EARTH_ROTATION = 7.2921159e-5;
  const START_MS = Date.now();

  const imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    credit: "© OpenStreetMap contributors",
  });

  function createViewer(container, sceneMode) {
    return new Cesium.Viewer(container, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: true,
      imageryProvider,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      sceneMode,
    });
  }

  const viewer2d = createViewer("viewer2d", Cesium.SceneMode.SCENE2D);
  const viewer3d = createViewer("viewer3d", Cesium.SceneMode.SCENE3D);

  viewer2d.scene.backgroundColor = Cesium.Color.BLACK;
  viewer3d.scene.backgroundColor = Cesium.Color.BLACK;

  function positionEcef(date) {
    const t = (date.getTime() - START_MS) / 1000;
    const u = OMEGA * t;
    const xOrb = ORBIT_RADIUS * Math.cos(u);
    const yOrb = ORBIT_RADIUS * Math.sin(u);

    const xEci = xOrb;
    const yEci = yOrb * Math.cos(INCLINATION);
    const zEci = yOrb * Math.sin(INCLINATION);

    const theta = EARTH_ROTATION * t;
    const x = xEci * Math.cos(theta) + yEci * Math.sin(theta);
    const y = -xEci * Math.sin(theta) + yEci * Math.cos(theta);
    const z = zEci;

    return new Cesium.Cartesian3(x, y, z);
  }

  const satPosition = new Cesium.CallbackProperty(function (_, result) {
    return positionEcef(new Date(), result);
  }, false);

  const entity3d = viewer3d.entities.add({
    position: satPosition,
    point: { pixelSize: 8, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.RED, outlineWidth: 2 },
    path: {
      width: 2,
      resolution: 60,
      material: Cesium.Color.RED,
      leadTime: PERIOD_S,
      trailTime: PERIOD_S,
    },
  });

  const entity2d = viewer2d.entities.add({
    position: satPosition,
    point: { pixelSize: 8, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.RED, outlineWidth: 2 },
    path: {
      width: 2,
      resolution: 60,
      material: Cesium.Color.RED,
      leadTime: PERIOD_S,
      trailTime: PERIOD_S,
    },
    ellipse: {
      semiMajorAxis: 2500000,
      semiMinorAxis: 2500000,
      material: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.22),
      outline: true,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.7),
      height: 0,
    },
  });

  viewer2d.trackedEntity = entity2d;
  viewer3d.trackedEntity = entity3d;

  const timeUtc = document.getElementById("timeUtc");
  const lat = document.getElementById("lat");
  const lon = document.getElementById("lon");
  const alt = document.getElementById("alt");

  function updateTelemetry() {
    const now = new Date();
    const cart = positionEcef(now);
    const carto = Cesium.Cartographic.fromCartesian(cart);

    timeUtc.textContent = now.toUTCString();
    lat.textContent = Cesium.Math.toDegrees(carto.latitude).toFixed(2);
    lon.textContent = Cesium.Math.toDegrees(carto.longitude).toFixed(2);
    alt.textContent = (carto.height / 1000).toFixed(1);
  }

  setInterval(updateTelemetry, 500);
  updateTelemetry();
})();
