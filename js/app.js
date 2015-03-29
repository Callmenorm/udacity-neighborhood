$(document).ready(function() {
  ko.applyBindings(new MapViewModel());
});

function MapViewModel() {
  var self = this;

  self.unfilteredMarkers = ko.observableArray();

  function markerCoordinateMaker(coords, title, url) {
    return {
      coords: new google.maps.LatLng(coords.lat, coords.lng),
      title: title,
      url: url
    };
  }

  self.baseMapCenter = ko.observable({
    lat: 40.249341,
    lng: -111.649289
  });

  self.unfilteredMarkers.push(markerCoordinateMaker({lat: 40.249341, lng: -111.649289}, 'BYU', 'http://home.byu.edu/home/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({lat: 40.244501, lng: -111.647369}, 'Slab Pizza', 'http://slabpizza.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({lat: 40.244648, lng: -111.64591}, 'Thai Ruby', 'http://thairubyfood.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({lat: 40.245304, lng: -111.646457}, 'J Dawgs', 'http://jdawgs.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({lat: 40.250659, lng: -111.647615}, 'MOA Cafe', 'http://dining.byu.edu/moacafe/'));

  self.filterText = ko.observable('');

  self.filteredMarkers = ko.computed(function() {
    var self = this;
    var temp = self.unfilteredMarkers().filter(function(element, index) {
      if (this.filterText && this.filterText() === '') {
        return true;
      } else {
        return element.title.match(new RegExp('.*' + this.filterText() + '.*', 'i')) !== null;
      };
    }, self);

    console.log(temp);
    return temp;
  }, self).extend({
    rateLimit: 50,
    notify: 'always'
  });

  console.log(self.filteredMarkers());

  self.googleMap = ko.computed(function() {
    return {
      center: this.baseMapCenter,
      markers: []
    };
  }, self).extend({
    rateLimit: 50,
    notify: 'always'
  });

  self.fourSquareSearchString = "";
  self.fourSquareSearchResults = ko.observableArray();
  self.formattedFourSquareSearchResults = ko.pureComputed(function() {
    return this.fourSquareSearchResults().filter(function(result, idx) {
      return result.location.address
    }).map(function(result, idx) {
      return {
        name: result.name,
        location: result.location.address,
        coords: {
          lat: result.location.lat,
          lng: result.location.lng
        },
        url: result.url
      };
    });
  }, self);

  self.searchFourSquare = (function(that) {
    return function() {
      var fourSquareClientId = 'client_id=PJEKWKS1MTZP3FAD0W1QLIQ0Z0ZHXPWUWO2GWDHP5FJTJHHV',
        fourSquareClientSecret = 'client_secret=MP3GX2SPOYDLSDWHZB1QG3KUV4G2QBZ1FVBTWIEPJCSKB4ML',
        fourSquareAPIVersion = 'v=20150322',
        fourSquareSearchRadius = 'radius=2500',
        fourSquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=40.249341,-111.649289&' +
        fourSquareClientId + '&' + fourSquareClientSecret + '&' + fourSquareAPIVersion +
        '&query=' + that.fourSquareSearchString + '&' + fourSquareSearchRadius;

      $.getJSON(fourSquareUrl, function(data) {
        that.fourSquareSearchResults(data.response.venues);
        console.log(data.response.venues);
      });
    };
  })(self);

  self.logCoords = function(location) {
      console.log('lat: ' + location.lat);
      console.log('lng: ' + location.lng);
  };

  self.addFourSquareMarker = function(data) {
      self.unfilteredMarkers.push(markerCoordinateMaker(data.coords, data.name, data.url));
      console.log(data);
  };
}


ko.bindingHandlers.map = {
  init: function(element, valueAccessor, allBindings) {
    var mapObj = ko.unwrap(valueAccessor()),
      latLng = new google.maps.LatLng(
        ko.unwrap(mapObj.center().lat),
        ko.unwrap(mapObj.center().lng)),
      mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

    mapObj.googleMap = new google.maps.Map(element, mapOptions);

    console.log(allBindings.get('markers')());

    $.each(allBindings.get('markers')(), function(idx, marker, array) {
      mapObj.markers.push(new google.maps.Marker({
        map: mapObj.googleMap,
        position: marker.coords,
        title: marker.title,
        draggable: false
      }));
    });
    $("#" + element.getAttribute("id")).data("mapObj", mapObj);
  },
  update: function(element, valueAccessor, allBindings) {
    var mapObj = ko.unwrap(valueAccessor());

    $.each(mapObj.markers, function(idx, marker, array) {
      marker.setMap(null);
    });

    mapObj.markers = [];
    $.each(allBindings.get('markers')(), function(idx, marker, array) {
      mapObj.markers.push(new google.maps.Marker({
        map: mapObj.googleMap,
        position: marker.coords,
        title: marker.title,
        draggable: false
      }));
    });
  }
};
