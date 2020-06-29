// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyD7jbSpu4N6eu1vEG9tPC27GapEerV6jo0",
    authDomain: "sgoce-danisen.firebaseapp.com",
    databaseURL: "https://sgoce-danisen.firebaseio.com",
    projectId: "sgoce-danisen",
    storageBucket: "sgoce-danisen.appspot.com",
    messagingSenderId: "648706215787",
    appId: "1:648706215787:web:40fd3d45b842c386cb862e",
    measurementId: "G-8K71JBSRS6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

    // FirebaseUI config.
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                document.getElementById("danisen").innerHTML = "<button onclick='danisen.displayPlayers()'>Players</button><button onclick='danisen.displayMatches()'>Matches</button><div id='content'></div>";
                return false;
            }
        },

        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
        ],
        // tosUrl and privacyPolicyUrl accept either url string or a callback
        // function.
        // Terms of service url/callback.
        tosUrl: function() {},
        // Privacy policy url/callback.
        privacyPolicyUrl: function() {}
      };
  
      // Initialize the FirebaseUI Widget using Firebase.
      var ui = new firebaseui.auth.AuthUI(firebase.auth());
      // The start method will wait until the DOM is loaded.
      ui.start('#firebaseui-auth-container', uiConfig);

//let this line rest in piece as if you say, "fuck javascript/firebase"
//danisen.db.collection("Matches").get().then((query) => {query.forEach((doc) => {doc.data().p1.get().then((query) => {console.log(query.data())});});})

var danisen = {};

danisen.players = {};
danisen.matches = {};
danisen.page = 0;

danisen.ranks = ["Unranked", "C -2", "C -1", "C 0", "C 1", "C 2", "B -2", "B -1", "B 0", "B 1", "B 2", "A -2", "A -1", "A 0", "A 1", "A 2", "S 0", "S 1", "S 2", "S 3", "S 4", "SSS"];
danisen.ranksLetter = ["0", "1", "1", "1", "1", "1", "2", "2", "2", "2", "2", "3", "3", "3", "3", "3", "4", "4", "4", "4", "4", "5"];

danisen.db = firebase.database();

danisen.functions = firebase.functions();

danisen.updatePlayers = function(players) {

    danisen.players = {};

    players.forEach(function (snapPlayer) {

        player = snapPlayer.val();

        danisen.players[player.name] = {};
        danisen.players[player.name].rank = player.rank;
        danisen.players[player.name].key = snapPlayer.key;
        danisen.players[player.name].id = player.discordID;
    })

    if (danisen.page == 1){
        danisen.displayPlayers();
    }

}

danisen.updateMatches = function(matches) {

    danisen.matches = [];

    for (var match in matches){
        danisen.matches.push({
            p1: matches[match].p1,
            p2: matches[match].p2
        });
    }

    if (danisen.page == 2){
        danisen.displayMatches();
    }
}


danisen.displayPlayers = function() {

    string = "";
    for (var player in danisen.players) {
        string = (player + " at rank: " + danisen.ranks[danisen.players[player].rank]) + string;
        string = "<br>" + string;
    }

    string += "<br><br>";

    string += "Name: <input id=playerName></input><br>"
    string += "Discord Tag: <input id=playerID></input><br>"
    string += "Rank: <input id=playerRank></input><br>"
    string += "<button onclick=\"danisen.addPlayer()\">Add player</button>"
    
    document.getElementById("content").innerHTML = string;
    danisen.page = 1;
}

danisen.addPlayer = function() {

    if(danisen.page == 1){
        pathid = danisen.db.ref("Players").push().getKey();

        name = document.getElementById("playerName").value;
        id = document.getElementById("playerID").value;
        rank = document.getElementById("playerRank").value;

        danisen.db.ref("Players/" + pathid).set({
            name: name,
            discordID: id,
            rank: rank,
        });
    }
}

danisen.displayMatches = function() {

    string = "";

    string += "<button onclick='danisen.createMatches()'>Generate Matches</button><br>";

    for (var match in danisen.matches) {
        string += danisen.keytoname(danisen.matches[match].p1) + " vs " + danisen.keytoname(danisen.matches[match].p2);
        string += "<br>";
    }

    string += "<br><br> Discord ping copy/paste: <br><br>";

    for (var match in danisen.matches) {
        string += danisen.keytodiscord(danisen.matches[match].p1) + " vs " + danisen.keytodiscord(danisen.matches[match].p2);
        string += "<br>";
    }

    document.getElementById("content").innerHTML = string;
    danisen.page = 2;

}

danisen.createMatches = function() {
    danisen.db.ref("Players/").once('value', function(snapshot) {
        
        val = snapshot.val();
        playerarray = [];


        for(var player in val){
            
            //player = key, eg -MAukJwmoswJ7ws8pZ_I
            playerarray.push(player);

        }

        matchMatrix = [];

        danisen.db.ref("Matches").remove();

        for(var i = 0; i < playerarray.length; i++) {
            matchMatrix[i] = [];

            for(var j = 0; j < playerarray.length; j++) {

                if (i == j) {
                    
                } else if(danisen.keytorank(playerarray[i]) == danisen.keytorank(playerarray[j])) {
                    matchMatrix[i].push(j);
                } else if(danisen.keytorank(playerarray[i]) == (+danisen.keytorank(playerarray[j]) - 1)) {
                    matchMatrix[i].push(j);
                } else if(danisen.keytorank(playerarray[i]) == (+danisen.keytorank(playerarray[j]) + 1)) {
                    matchMatrix[i].push(j);
                }
            }
        }

        for (var i in matchMatrix){

            var j = matchMatrix[i][Math.floor(Math.random() * matchMatrix[i].length)];

            if(j) {
                danisen.addMatch(playerarray[i], playerarray[j]);
            }
            //i = p1 j = p2

            //Need to delete jth matchMatrix
            matchMatrix[j] = [];

            //Then delete all is and js from matchMatrix

            for (var k in matchMatrix) {
                for (var l in matchMatrix[k]) {
                    if (matchMatrix[k][l] == i) {
                        matchMatrix[k].splice(l, 1);
                    } else if (matchMatrix[k][l] == j) {
                        matchMatrix[k].splice(l, 1);
                    }
                }
            }

        }


    });
}

danisen.addMatch = function(p1, p2) {

    pathid = danisen.db.ref("Matches").push().getKey();
    danisen.db.ref("Matches/" + pathid).set({
        p1: p1,
        p2: p2
    });
}

danisen.keytorank = function(key) {
    var rank;

    for (var player in danisen.players) {
        if (danisen.players[player].key == key) {rank = danisen.ranksLetter[danisen.players[player].rank]}
    }
    return rank;
}

danisen.keytoname = function(key) {
    var name;

    for (var player in danisen.players) {
        if (danisen.players[player].key == key) {name = player}
    }
    return name;
}

danisen.keytodiscord = function(key) {
    var name;

    for (var player in danisen.players) {
        if (danisen.players[player].key == key) {name = danisen.players[player].id}
    }
    return name;
}

danisen.db.ref("Players/").orderByChild('rank').on('value', function(snapshot) {danisen.updatePlayers(snapshot);});

danisen.db.ref("Matches/").on('value', function(snapshot) {danisen.updateMatches(snapshot.val());});