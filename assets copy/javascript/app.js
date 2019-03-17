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

  // WORKING ON USER AUTHENTICATION~vv
  uiConfig = {
    signInSuccessUrl: "<url-to-redirect-to-on-success>",
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
    // tosUrl and privacyPolicyUrl accept either url string or a callback
    // function.
    // Terms of service url/callback.
    tosUrl: "<your-tos-url>",
    // Privacy policy url/callback.
    privacyPolicyUrl: function() {
      window.location.assign("<your-privacy-policy-url>");
    }
  };
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded.
  ui.start("#firebaseui-auth-container", uiConfig);
  // WORKING ON USER AUTHENTICATION~^^

  //   Thanks to tutor Brian Ngobidi for walking me through the global flags and firebase reference keys required for the (update details /remove train) functionality
  //   global flag to handle whether train is being updated or pushed
  var updateEntry = false;
  //   global flag to handle firebase key for train updates or removal
  var updateTrainId;
  // update time (and therefore everything) every 10 seconds, as well as on page load and submit
  updateTime();
  let updateinterval = setInterval(updateTime, 10000);
  function updateTime() {
    $("#trainList").empty();
    dB.ref("trainTime/").on("child_added", function(snap) {
      // get the data from the database

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
      // dynamically generate html
      let postTrain = $("<tr>")
        .append($("<td>").text(name))
        .append($("<td>").text(destination))
        .append($("<td>").text(tripFrequency))
        .append($("<td>").text(nextArrival))
        .append($("<td>").text(minutesAway))
        .append($("<td>").text(track))
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
      $("#trainList").append(postTrain);
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
