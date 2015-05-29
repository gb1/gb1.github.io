sap.ui.controller("com.gregorbrett.soundcloui5d.view.Main", {

	_soundObject: null,
	_db: null,

	onInit: function() {

		SC.initialize({
			client_id: "8d593513ca43f7b7e5c3371f187a2953"
		});

		this._initModel();
		this._openDatabase();
		this.loadRecentTracks();
		this._loadFavsFromDB();
	},

	_initModel: function() {
		var trackModel = new sap.ui.model.json.JSONModel({
			"tracks": []
		});
		trackModel.setDefaultBindingMode("OneWay");
		sap.ui.getCore().setModel(trackModel);

		var favsModel = new sap.ui.model.json.JSONModel({
			"tracks": []
		});
		sap.ui.getCore().setModel(favsModel, "favs");

	},

	_openDatabase: function() {
        this._db = new PouchDB('favs');
	},

    _loadFavsFromDB: function(){
        
        var trackData = sap.ui.getCore().getModel("favs").getData();
        
        this._db.allDocs({include_docs: true, descending: true}, function(err, doc) {
                $.each(doc.rows, function(index, track) {
				    trackData.tracks.push(track.doc.track_data);
			    });
			    sap.ui.getCore().getModel("favs").setData(trackData);
        });
    },

	_addFavoriteToDB: function(track) {
	    
	    var fav = {
	      _id: "" + track.id,
	      track_data: track
	    };
	   
	    this._db.put(fav, function callback(err, result){
	       if(!err){
	           console.log("great success");
	       }else{
	           console.error("error", err)
	       }
	    });
	},
	
	_removeFavoriteFromDB: function(track){
	    
        var fav = {
	      _id: "" + track.id,
	      track_data: track
	    };
	    
	    this._db.remove(track);
	    
	},

	loadRecentTracks: function(oEvent) {

		var that = this;

		var trackData = sap.ui.getCore().getModel().getData();

		SC.get("/tracks", {
			limit: 100
		}, function(tracks) {

			$.each(tracks, function(index, track) {
				trackData.tracks.push(track);
			});

			sap.ui.getCore().getModel().setData(trackData);

			that.getView().byId("pullToRefresh").hide();

		});

	},

	selectTrack: function(oEvent) {

		var that = this;

		if (this._soundObject) {
			this._soundObject.stop();
		}

        var track;
		if(oEvent.getSource().getBindingContext()){
		    track = oEvent.getSource().getBindingContext().getObject();
		}else{
		    track = oEvent.getSource().getBindingContext("favs").getObject();
		}

		SC.stream(track.stream_url, function(sound) {
			that._soundObject = sound;
			that._soundObject.play();

			that.getView().byId("trackName").setText(track.title);
		});

	},

	pause: function(oEvent) {

		if (this._soundObject && !this._soundObject.paused) {
			this._soundObject.pause();
			oEvent.getSource().setIcon("sap-icon://play");
		} else {

			this._soundObject.play();
			oEvent.getSource().setIcon("sap-icon://pause");
		}
	},

	handleFavorite: function(oEvent) {

		var oList = oEvent.getSource().getParent();
		var track = oList.getSwipedItem().getBindingContext().getObject();
		oList.swipeOut();

		var trackData = sap.ui.getCore().getModel("favs").getData();
		trackData.tracks.push(track);
		sap.ui.getCore().getModel("favs").setData(trackData);

        this._addFavoriteToDB(track);

		sap.m.MessageToast.show("Favorite added");

	},

	handleFavoriteRemove: function(oEvent) {

		var oList = oEvent.getSource().getParent();
		
		var track = oList.getSwipedItem().getBindingContext("favs").getObject();
		this._removeFavoriteFromDB(track);
		
		oList.removeAggregation("items", oList.getSwipedItem());
		
		oList.swipeOut();

	}

});