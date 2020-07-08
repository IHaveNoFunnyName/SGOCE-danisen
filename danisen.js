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

var danisen = {};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// FirebaseUI config.
var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            document.getElementById("danisen").innerHTML = "<button onclick='danisen.displayPlayers()'>Rankings</button><button onclick='danisen.displayMatches()'>Weekly Matches</button><div id='content'></div>";
            danisen.admin = authResult.additionalUserInfo.providerId ? 1 : 0;
            danisen.displayPlayers();
            return false;
        },
        
        uiShown: function() {
            document.getElementsByClassName('firebaseui-tos firebaseui-tospp-full-message')[0].innerHTML = "";
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


danisen.players = {};
danisen.matches = {};
danisen.page = 0;

danisen.ranks = ["Unranked", "C -2", "C -1", "C 0", "C 1", "C 2", "B -2", "B -1", "B 0", "B 1", "B 2", "A -2", "A -1", "A 0", "A 1", "A 2", "S 0", "S 1", "S 2", "S 3", "S 4", "SSS"];
danisen.ranksLetter = ["0", "1", "1", "1", "1", "1", "2", "2", "2", "2", "2", "3", "3", "3", "3", "3", "4", "4", "4", "4", "4", "5"];
danisen.error = "";

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
        danisen.players[player.name].desiredMatches = player.desiredMatches ? player.desiredMatches : 1;
        if (danisen.players[player.name].desiredMatches == 1) {
            danisen.players[player.name].desiredMatches = 2;
        }
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
        string = ("<b>" + player + "</b>:  " + danisen.ranks[danisen.players[player].rank]) + string;
        string = "<br>" + string;
    }
    
    if (danisen.admin){
        string += "<br><br>";
        
        string += "Name: <input id=playerName></input><br>"
        string += "Discord Tag: <input id=playerID></input><br>"
        string += "Rank: <select id=playerRank>"
        
        for (var i=0; i < danisen.ranks.length; i++){
            string += "<option value='" + i + "'>" + danisen.ranks[i] + "</option>";
        }
        
        string +="</select><br>"
        string += "<button onclick=\"danisen.addPlayer()\">Add player</button><br><br>"
        
        string += "<select id='removeList'>"
        for (var player in danisen.players) {
            string += "<option value='" + danisen.players[player].key + "'>" + player + "</option>";
        }
        string += "</select><button onclick=\"danisen.removePlayer()\">Delete player</button><br><br>"
        
        string += "<select id='desiredList'>"
        for (var player in danisen.players) {
            string += "<option value='" + danisen.players[player].key + "'>" + player + "</option>";
        }
        string += "<input id='desiredX'></input>"
        string += "</select><button onclick=\"danisen.setDesiredMatches()\">Set number of matches</button>"
    }
    
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
            rank: +rank,
        });
    }
}

danisen.removePlayer = function() {
    
    danisen.db.ref('Players/' + document.getElementById("removeList").value).remove();
}

danisen.displayMatches = function() {
    
    string = "<br>";
    
    string += danisen.admin ? "<button onclick='danisen.createMatches()'>Generate Matches</button><br>" : "";
    
    for (var match in danisen.matches) {
        string += "<b>" +  danisen.keytoname(danisen.matches[match].p1) + "</b>" + " vs " + "<b>" + danisen.keytoname(danisen.matches[match].p2)+ "</b>";
        string += "<br>";
    }

    string += "<br>" + danisen.error;

    if (danisen.admin){
        
        string += "<br><br> <h3>Discord ping copy/paste</h3>";
        
        string += "<button onclick=\"danisen.copyToClipboard()\">I'm lazy, copy to clipboard for me</button> <br><br>"
        
        for (var match in danisen.matches) {
            string += danisen.keytodiscord(danisen.matches[match].p1) + " vs " + danisen.keytodiscord(danisen.matches[match].p2);
            string += "<br>";
            
        }
        
    }
    
    document.getElementById("content").innerHTML = string;
    danisen.page = 2;
    
}

danisen.createMatches = function() {

    danisen.db.ref("Matches/").remove();

    danisen.error = "";
    
    matchMatrix = [];
    
    for(player in danisen.players){
        
        if(danisen.players[player].desiredMatches) {
            matchMatrix.push({
                key: danisen.players[player].key,
                remaining: danisen.players[player].desiredMatches                
            })
        }
    }
    
    //For each player, 
    
    for(var i in matchMatrix){
        
        matchMatrix[i].validMatches = []
        
        for(var j in matchMatrix){
            
            rank1 = danisen.keytorank(matchMatrix[i].key);
            rank2 = danisen.keytorank(matchMatrix[j].key);
            
            if( (rank1 == rank2 ||
                rank1 == rank2 - 1 ||
                rank1 == rank2 + 1) &&
                i != j) {
                    
                    matchMatrix[i].validMatches.push(matchMatrix[j].key);
                    
                }
            }
        }
        
        //Sort array so that lowest amount of valid opponents gets selected first, minimizing the chance of someone having no valid matches
        matchMatrix = matchMatrix.sort(function(a, b){return a.validMatches.length - b.validMatches.length});
        
        var player1;
        var player2;
        var matchMade = 1;
        
        while(matchMade){
            matchMade = 0;
            for (player1 in matchMatrix) {
                if(matchMatrix[player1].remaining){
                    player2 = matchMatrix[player1].validMatches[Math.floor(Math.random() * matchMatrix[player1].validMatches.length)];
                    
                    if(player2) {
                        danisen.addMatch(matchMatrix[player1].key, player2);
                        danisen.deleteKeyFromMatrix(matchMatrix, matchMatrix[player1].key);
                        danisen.deleteKeyFromMatrix(matchMatrix, player2);
                        matchMade = 1;
                    } else {
                        console.log("Couldn't find match for: " + danisen.keytoname(matchMatrix[player1].key));
                        danisen.error += "Couldn't find match for: " + danisen.keytoname(matchMatrix[player1].key) + "<br>";
                        danisen.displayMatches();
                    }
                }
            }
        }
    }
    
    danisen.deleteKeyFromMatrix = function(matrix, key) {
        
        var i;
        
        for(i in matrix) {
            if (matrix[i].key == key){
                break;
            }
        }
        
        matrix[i].remaining --;
        if(matrix[i].remaining == -1) {
            i++;
        }
        
        if (matrix[i].remaining == 0){
            for (var j in matrix){
                for (var p2 in matrix[j].validMatches){
                    if (matrix[j].validMatches[p2] == key){
                        matrix[j].validMatches.splice(p2,1);
                    }
                }
            }
        }
    }
    
    danisen.addMatch = function(p1, p2) {
        
        pathid = danisen.db.ref("Matches").push().getKey();
        danisen.db.ref("Matches/" + pathid).set({
            p1: p1,
            p2: p2
        });
        console.log(danisen.keytoname(p1) + " vs " + danisen.keytoname(p2));
    }
    
    danisen.keytorank = function(key) {
        var rank;
        
        for (var player in danisen.players) {
            if (danisen.players[player].key == key) {rank = danisen.ranksLetter[danisen.players[player].rank]}
        }
        return +rank;
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
    
    danisen.copyToClipboard = function() { 
        //Lazy as fuck, but whatever  
        str = "";
        for (var match in danisen.matches) {
            str += danisen.keytodiscord(danisen.matches[match].p1) + " vs " + danisen.keytodiscord(danisen.matches[match].p2) + "\n";
        }
        const el = document.createElement('textarea');
        el.value = str;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    
    danisen.setDesiredMatches = function() {
        var key = document.getElementById("desiredList").value;
        var x = document.getElementById("desiredX").value;
        danisen.db.ref("Players/" + key).update({"desiredMatches": +x});
    }
    
    danisen.db.ref("Players/").orderByChild('rank').on('value', function(snapshot) {danisen.updatePlayers(snapshot);});
    
    danisen.db.ref("Matches/").on('value', function(snapshot) {danisen.updateMatches(snapshot.val());});
    
    