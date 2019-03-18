$(document).ready(function() {
  // initialize the database
  var config = {
    apiKey: "AIzaSyDl3XzwDijfsqFMchoEqe-rBCqVfgbggIs",
    authDomain: "nuchibootcamper.firebaseapp.com",
    databaseURL: "https://nuchibootcamper.firebaseio.com",
    projectId: "nuchibootcamper",
    storageBucket: "nuchibootcamper.appspot.com",
    messagingSenderId: "348555228882"
  };
  firebase.initializeApp(config);
  var dB = firebase.database();

  // initialize the user authentication functions
  uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        return true;
      }
    },
    signInSuccessUrl:
      "https://nickgroesch.github.io/authenticationTrainScheduler",
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
      // firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
    // page redirect was a little "fuzzy" compared to popup
    signInFlow: "popup"
  };
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start("#firebaseui-auth-container", uiConfig);
  // .LOCAL and .SESSION storage of user authentication made a bug where on page load the trains printed twice for first ten seconds so lets try .NONE
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
  // global flag for user signed-in to display admin buttons
  let userAuth = false;
  // if user is authenticated then they can see admin functions
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $(".hidden").removeClass("hidden");
      $(".auth").addClass("hidden");
      userAuth = true;
      updateTime();
    }
  });
  function renderTable(object) {
    let postTrain = $("<tr>")
      .append($("<td>").text(object.name))
      .append($("<td>").text(object.destination))
      .append($("<td>").text(object.tripFrequency))
      .append($("<td>").text(object.nextArrival))
      .append($("<td>").text(object.minutesAway))
      .append($("<td>").text(object.track));
    if (userAuth) {
      postTrain
        .append(
          $("<td>").append(
            $(
              `<button class="update" data-key="${
                snap.key
              }" data-name="${name}" data-destination="${destination}" data-tripFrequency="${tripFrequency}" data-initialTrip="${initialTrip}">`
            ).text("Update")
          )
        )
        .append(
          $("<td>").append(
            $(
              `<button class="remove" id="remove${name}" data-key="${
                snap.key
              }">`
            ).text("Remove")
          )
        );
    }
    $("#trainList").append(postTrain);
  }
  function trainMath(snap) {
    let name = snap.val().name;
    let destination = snap.val().destination;
    let initialTrip = snap.val().initialTrip;
    let tripFrequency = snap.val().tripFrequency;
    let track = snap.val().track;
    // do the math for display
    let now = moment().format("h:mm a");
    $("#now").text(`The time is now ${now}`);
    let initialTripPastTense = moment(initialTrip, "HH:mm").subtract(
      1,
      "years"
    );
    let deltaTime = moment().diff(moment(initialTripPastTense), "minutes");
    let moduloTime = deltaTime % tripFrequency;
    let minutesAway = tripFrequency - moduloTime;
    let nextArrival = moment()
      .add(minutesAway, "minutes")
      .format("h:mm a");
    return {
      name,
      destination,
      track,
      nextArrival,
      minutesAway,
      tripFrequency
    };
  }

  //   Thanks to tutor Brian Ngobidi for walking me through the global flags and firebase reference keys required for the (update details /remove train) functionality
  //   global flag to handle whether train is being updated or pushed
  var updateEntry = false;
  //   global flag to handle firebase key for train updates or removal
  var updateTrainId;
  let tableRows;
  // update time (and therefore everything) every 10 seconds, as well as on page load and submit
  // updateTime();
  let updateinterval = setInterval(updateTime, 10000);
  dB.ref("trainTime/").on("child_added", function(snap) {
    // tableRows.push(snap);
    // console.log(tableRows);

    // get the data from the database
    let trainObject = trainMath(snap);
    // dynamically generate html
    renderTable(trainObject);
    // render train table function
  });
  function updateTime() {
    $("#trainList").empty();
    dB.ref("trainTime/").on("child_added", function(snapshot) {
      // console.log(snapshot.val());

      let trainObject = trainMath(snapshot);
      // dynamically generate html
      renderTable(trainObject);
    });
  }
  //update trains
  $(document).on("click", ".update", function(e) {
    let train = $(e.target);
    let name = train.attr("data-name");
    let destination = train.data("destination");
    let initialTrip = train.attr("data-initialTrip");
    let tripFrequency = train.attr("data-tripFrequency");
    updateTrainId = train.attr("data-key");
    updateEntry = true;
    $("#trainName").val(name);
    $("#destination").val(destination);
    $("#firstTrain").val(initialTrip);
    $("#arrivalFrequency").val(tripFrequency);
  });
  // remove trains
  $(document).on("click", ".remove", function(e) {
    let train = $(e.target);
    updateTrainId = train.attr("data-key");
    dB.ref("trainTime/" + updateTrainId).remove();
    updateTime();
  });
  //submit train information to database
  $(document).on("click", "#makeItSo", function(e) {
    e.preventDefault();
    // let newTrain = {};
    let name = $("#trainName")
      .val()
      .trim();
    let destination = $("#destination")
      .val()
      .trim();
    let initialTrip = $("#firstTrain")
      .val()
      .trim();
    let tripFrequency = $("#arrivalFrequency")
      .val()
      .trim();
    let track = Math.ceil(Math.random() * 12);
    // I had a harder time tracking down reference key by inserting the whole object vs the key:value pairs--perhaps this could be improved
    // newTrain = {
    //   name: name,
    //   destination: destination,
    //   initialTrip: initialTrip,
    //   tripFrequency: tripFrequency,
    //   track: track
    // };

    // since we've captured the values we clear the form
    $("#trainName").val("");
    $("#destination").val("");
    $("#firstTrain").val("");
    $("#arrivalFrequency").val("");

    if (updateEntry) {
      //update specific entry
      dB.ref("trainTime/" + updateTrainId).set({
        name: name,
        destination: destination,
        initialTrip: initialTrip,
        tripFrequency: tripFrequency,
        track: track
      });
      updateEntry = false;
    } else {
      dB.ref("trainTime").push({
        name: name,
        destination: destination,
        initialTrip: initialTrip,
        tripFrequency: tripFrequency,
        track: track
      });
    }
    updateTime();
  });
});
