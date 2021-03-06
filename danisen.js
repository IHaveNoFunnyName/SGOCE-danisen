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
            document.getElementById("danisen").innerHTML = "<button onclick='danisen.displayPlayers()'>Rankings</button><button onclick='danisen.displayMatches()'>Weekly Matches</button><button onclick='danisen.displayHistory()'>Match History</button>";
            danisen.admin = authResult.additionalUserInfo.providerId ? 1 : 0;
            document.getElementById("danisen").innerHTML += danisen.admin ? "<button onclick='danisen.subpage = 0; danisen.displayReport()'>Report Matches</button><div id='content'></div>" : "<div id='content'></div>";
            danisen.displayPlayers();
            
            danisen.db.ref("Players/").orderByChild('rank').on('value', function(snapshot) {danisen.updatePlayers(snapshot);});
            
            danisen.db.ref("Matches/").on('value', function(snapshot) {danisen.updateMatches(snapshot.val());});
            
            danisen.db.ref("PrevMatches/").on('value', function(snapshot) {danisen.updatePrevMatches(snapshot.val());});
            
            danisen.db.ref("MatchHistory/").on('value', function(snapshot) {danisen.updateHistory(snapshot.val());});
            
            danisen.db.ref("UnconfirmedMatchHistory/").on('value', function(snapshot) {danisen.updateUnconfMatches(snapshot);});
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
danisen.matches = [];
danisen.prevmatches = [];
danisen.allmatches = [];
danisen.matchHistory = [];
danisen.matchHistory2w = [];
danisen.unconfMatches = [];
danisen.page = 0;
danisen.subpage = 0;
danisen.discordReport = 0;

danisen.ranks = ["Unranked", "C -2", "C -1", "C 0", "C 1", "C 2", "B -2", "B -1", "B 0", "B 1", "B 2", "A -2", "A -1", "A 0", "A 1", "A 2", "S 0", "S 1", "S 2", "S 3", "S 4", "S 5"];
danisen.ranksLetter = ["0", "1", "1", "1", "1", "1", "2", "2", "2", "2", "2", "3", "3", "3", "3", "3", "4", "4", "4", "4", "4", "4"];
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
        danisen.players[player.name].desiredMatches = player.desiredMatches;
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
            p2: matches[match].p2,
            key: match
        });
    }
    
    if (danisen.page == 2){
        danisen.displayMatches();
    } else if (danisen.page == 4){
        danisen.displayReport();
    }
    
    danisen.loading(0);
}

danisen.updatePrevMatches = function(matches) {
    
    danisen.prevmatches = [];
    
    for (var match in matches){
        danisen.prevmatches.push({
            p1: matches[match].p1,
            p2: matches[match].p2,
            key: match
        });
    }
    
    if (danisen.page == 2){
        danisen.displayMatches();
    } else if (danisen.page == 4){
        danisen.displayReport();
    }
    
    danisen.loading(0);
}

danisen.updateHistory = function(matches) {
    
    danisen.matchHistory = [];
    danisen.matchHistory2w = [];
    
    for (var match in matches){
        danisen.matchHistory.push({
            p1: matches[match].p1,
            p2: matches[match].p2,
            p1Score: matches[match].p1Score,
            p2Score: matches[match].p2Score,
            time: matches[match].time,
            replay: matches[match].replay ? matches[match].replay : ""
        })
        if (Date.now() - matches[match].time < 1209600000){
            danisen.matchHistory2w.push({
                p1: matches[match].p1,
                p2: matches[match].p2,
            })
        }
    }
    
    danisen.matchHistory.sort((a, b) => (a.time < b.time) ? 1 : -1)
    
    if (danisen.page == 3) {
        danisen.displayHistory();
    }
    
}

danisen.updateUnconfMatches = function(matches) {
    danisen.unconfMatches = [];
    
    matches.forEach(function (snapMatch) {
        
        match = snapMatch.val();
        
        danisen.unconfMatches.push({
            attach: match.attach,
            link: match.link,
            time: match.time,
            text: match.message,
            key: snapMatch.key,
            id: match.id
        });
    });
    
    if (danisen.page == 4){
        danisen.displayReport();
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
    
    matches = danisen.matches.concat(danisen.prevmatches);
    
    string = "<br>";
    
    for (var match in matches) {
        string += "<b>" +  danisen.keytoname(matches[match].p1) + "</b>" + " vs " + "<b>" + danisen.keytoname(matches[match].p2)+ "</b>";
        string += "<br>";
    }
    
    string += "<br>" + danisen.error;
    
    if (danisen.admin){
        
        string += "<br><br> <h3>Discord ping copy/paste</h3>";
        
        string += "<button onclick=\"danisen.copyToClipboard()\">I'm lazy, copy to clipboard for me</button> <br><br>"
        
        for (var match in matches) {
            string += danisen.keytodiscord(matches[match].p1) + " vs " + danisen.keytodiscord(matches[match].p2);
            string += "<br>";
            
        }
        
    }
    
    document.getElementById("content").innerHTML = string;
    danisen.page = 2;
    
}

danisen.displayReport = function() {
    
    string = "<button onClick='danisen.subpage = 0; danisen.displayReport()'>Review Discord report</button>"
    string += "<button onClick='danisen.subpage = 1; danisen.displayReport()'>Report weekly match</button>"
    
    matches = danisen.matches.concat(danisen.prevmatches);
    
    if (danisen.subpage == 1){
        string += "<br><select id='report'>";
        
        for(match in matches){
            string += "<option value='" + match + "'>" + danisen.keytoname(matches[match].p1) + " vs " + danisen.keytoname(matches[match].p2) + "</option>";
        }
        string += "</select><br>";
        
        string += "P1:<select id=p1Score><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P2:<select id=p2Score><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select><br>";
        
        string += "Replay Link:<input id=replay></input><br>"
        
        string += "<button onClick='danisen.reportMatch()'>Report Match</button>";
    } else if (danisen.subpage == 0){
        
        string += "<br><select id='report'>";
        
        for(match in matches){
            string += "<option value='" + match + "'>" + danisen.keytoname(matches[match].p1) + " vs " + danisen.keytoname(matches[match].p2) + "</option>";
        }
        string += "</select><br>";
        
        string += "P1:<select id=p1Score><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P2:<select id=p2Score><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select><br>";
        
        string += "Replay Link:<input id=replay value='" + danisen.getMessageAttach(danisen.discordReport) + "'></input><br>"
        
        string += "<br>Discord report by " + danisen.getName(danisen.discordReport) + " at " + danisen.getTime(danisen.discordReport) + ":"
        
        string += "<br>" + danisen.getMessage(danisen.discordReport).split("\n").join("<br />") + "</br>";
        
        string += "<a href='" + danisen.getLink(danisen.discordReport) + "'>Link to Discord message</a><br>"
        
        string += "<button onClick='danisen.prev()'>Previous</button><button onClick='danisen.reportMatch()'>Report</button><button onClick='danisen.next()'>Next</button>"
        
        string += "<br><br><button onClick='danisen.delete()'>Delete troll report</button>"
    }
    
    document.getElementById("content").innerHTML = string;
    danisen.page = 4;
    
}

danisen.getMessage = function(n) {
    return danisen.unconfMatches[n] ? danisen.unconfMatches[n].text : "";
}

danisen.getMessageAttach = function(n) {
    return danisen.unconfMatches[n] ? danisen.unconfMatches[n].attach : "";
}

danisen.getLink = function(n) {
    return danisen.unconfMatches[n] ? danisen.unconfMatches[n].link : "";
}

danisen.getName = function(n) {
    return danisen.unconfMatches[n] ? danisen.discordtoname(danisen.unconfMatches[n].id) : "";
}

danisen.getTime = function(n) {
    return danisen.unconfMatches[n] ? new Date(danisen.unconfMatches[n].time) : "";
}

danisen.next = function() {
    
    if (danisen.unconfMatches[danisen.discordReport + 1]) danisen.discordReport++;
    danisen.displayReport();
}

danisen.prev = function() {
    if (danisen.unconfMatches[danisen.discordReport - 1]) danisen.discordReport--;
    danisen.displayReport();
}

danisen.delete = function() {
    
    danisen.db.ref('UnconfirmedMatchHistory/' + danisen.unconfMatches[danisen.discordReport].key).remove();
    
}

danisen.displayHistory = function() {
    
    string = "<br>";
    
    for(match in danisen.matchHistory) {
        string += "<b>" + danisen.keytoname(danisen.matchHistory[match].p1) + "</b>: " + danisen.matchHistory[match].p1Score + " vs <b>" + danisen.keytoname(danisen.matchHistory[match].p2) + "</b>: " + danisen.matchHistory[match].p2Score;
        string += danisen.matchHistory[match].replay ? " Replay link: <a href='" + danisen.matchHistory[match].replay + "'>" + danisen.lastURLSection(danisen.matchHistory[match].replay) + "</a><br>" : "<br>";
    }
    
    document.getElementById("content").innerHTML = string;
    danisen.page = 3;
}

danisen.lastURLSection = function(string) {
    split = string.split("/");
    return split[split.length - 1];
}

danisen.reportMatch = function() {
    
    matches = danisen.matches.concat(danisen.prevmatches);
    match = document.getElementById("report").value;
    p1 = matches[match].p1;
    p2 = matches[match].p2;
    p1Score = document.getElementById("p1Score").value;
    p2Score = document.getElementById("p2Score").value;
    replay = document.getElementById("replay").value;
    time = danisen.subpage == 0 ? danisen.unconfMatches[danisen.discordReport].time : Date.now();
    
    if (p1Score !== "5" && p2Score !== "5") {alert("Neither of the players scores are 5")} else {
        
        pathid = danisen.db.ref("MatchHistory").push().getKey();
        danisen.db.ref("MatchHistory/" + pathid).set({
            p1: p1,
            p2: p2,
            p1Score: +p1Score,
            p2Score: +p2Score,
            replay: replay,
            time: time
        });
        danisen.loading(1);
        if(danisen.subpage == 0){
            danisen.delete();
        }
    }
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

danisen.discordtoname = function(id) {
    var name;
    
    for (var player in danisen.players) {
        if (danisen.players[player].id == id) {name = player}
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

danisen.loading = function(x) {
    if (x){
        document.getElementById("loader1").style.display = "inline";
        document.getElementById("loader2").style.display = "inline";
    } else {
        document.getElementById("loader1").style.display = "none";
        document.getElementById("loader2").style.display = "none";
    }
}