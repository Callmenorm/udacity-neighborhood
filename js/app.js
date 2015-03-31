$(document).ready(function() {
  ko.applyBindings(new MapViewModel());
});

function MapViewModel() {
  var self = this;

  self.unfilteredMarkers = ko.observableArray();

  self.baseMapCenter = ko.observable({
    lat: 40.249341,
    lng: -111.649289
  });

  //A small function to package the coordinates for google
  function markerCoordinateMaker(coords, title, url) {
    return {
      coords: new google.maps.LatLng(coords.lat, coords.lng),
      title: title,
      url: url
    };
  }

  //these are the initial locations on the map
  self.unfilteredMarkers.push(markerCoordinateMaker({
    lat: 40.249341,
    lng: -111.649289
  }, 'BYU', 'http://home.byu.edu/home/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({
    lat: 40.244501,
    lng: -111.647369
  }, 'Slab Pizza', 'http://slabpizza.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({
    lat: 40.244648,
    lng: -111.64591
  }, 'Thai Ruby', 'http://thairubyfood.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({
    lat: 40.245304,
    lng: -111.646457
  }, 'J Dawgs', 'http://jdawgs.com/'));
  self.unfilteredMarkers.push(markerCoordinateMaker({
    lat: 40.250659,
    lng: -111.647615
  }, 'MOA Cafe', 'http://dining.byu.edu/moacafe/'));

  //This filters the locations with a regex that is supplied by the user
  self.filterText = ko.observable('');
  self.filteredMarkers = ko.computed(function() {
    var self = this;
    return self.unfilteredMarkers().filter(function(element, index) {
      if (this.filterText && this.filterText() === '') {
        return true;
      } else {
        return element.title.match(new RegExp('.*' + this.filterText() + '.*', 'i')) !== null;
      };
    }, self);
  }, self).extend({
    rateLimit: 50,
    notify: 'always'
  });

  //This centers the map on the initial location
  self.googleMap = ko.computed(function() {
    return {
      center: this.baseMapCenter,
      markers: []
    };
  }, self).extend({
    rateLimit: 50,
    notify: 'always'
  });

  //This is the foursquare search results
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

  //This the hard coded foursquare information that we use to query foursquare's venue service
  self.searchFourSquare = (function(that) {
    return function() {
      var fourSquareClientId = 'client_id=PJEKWKS1MTZP3FAD0W1QLIQ0Z0ZHXPWUWO2GWDHP5FJTJHHV',
        fourSquareClientSecret = 'client_secret=MP3GX2SPOYDLSDWHZB1QG3KUV4G2QBZ1FVBTWIEPJCSKB4ML',
        fourSquareAPIVersion = 'v=20150322',
        fourSquareSearchRadius = 'radius=1500',
        fourSquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=40.249341,-111.649289&' +
        fourSquareClientId + '&' + fourSquareClientSecret + '&' + fourSquareAPIVersion +
        '&query=' + that.fourSquareSearchString + '&' + fourSquareSearchRadius;

      $.getJSON(fourSquareUrl, function(data) {
        that.fourSquareSearchResults(data.response.venues);
      });
    };
  })(self);

  //Adds the marker only if its not already in there
  self.addFourSquareMarker = function(data) {
    if (!self.unfilteredMarkers().some(function(marker, idx) {
        return marker.title === data.name && marker.url === data.url;
      })) {
      self.unfilteredMarkers.push(markerCoordinateMaker(data.coords, data.name, data.url));
    }
  };
}


ko.bindingHandlers.map = {
  //This initializes the google map and markers.
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

    //For each initial location a marker is made and an event is made display the name of the marker
    $.each(allBindings.get('markers')(), function(idx, marker, array) {
      var placeMarker = new google.maps.Marker({
        map: mapObj.googleMap,
        position: marker.coords,
        title: marker.title,
        draggable: false
      });

      google.maps.event.addListener(placeMarker, 'click', function() {
        var placeInfoWindow = new google.maps.InfoWindow({
          content: placeMarker.title
        });
        placeInfoWindow.open(placeMarker.get('map'), placeMarker);
      });
      mapObj.markers.push(placeMarker);
    });
  },
  update: function(element, valueAccessor, allBindings) {
    var mapObj = ko.unwrap(valueAccessor());

    //This deletes the old markers
    $.each(mapObj.markers, function(idx, marker, array) {
      marker.setMap(null);
    });

    //Places the filtered markers back on the map
    mapObj.markers = [];
    $.each(allBindings.get('markers')(), function(idx, marker, array) {
      var placeMarker = new google.maps.Marker({
        map: mapObj.googleMap,
        position: marker.coords,
        title: marker.title,
        draggable: false
      });

      //Add click listeners on them
      google.maps.event.addListener(placeMarker, 'click', function() {
        var placeInfoWindow = new google.maps.InfoWindow({
          content: placeMarker.title
        });
        placeInfoWindow.open(placeMarker.get('map'), placeMarker);
      });
      mapObj.markers.push(placeMarker);
    });
  }
};
