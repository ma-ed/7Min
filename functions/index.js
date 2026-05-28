const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const webpush = require("web-push");

initializeApp();

webpush.setVapidDetails(
  "mailto:eder.matthias@gmail.com",
  "BJyx6dSi7Nck2YjFmSSSCIXp9l9s7bao3cd2k3yTh_QDefUn74OSHs7PkqYzslZm3QmDWOOUVg4B-PakBUcpPII",
  "_EO_5iR1fyj8qBG5lEiIAbxkMWr_xYK-ZWiaU0Qc4zA"
);

exports.sendPushOnInbox = onDocumentCreated(
  "users/{uid}/inbox/{msgId}",
  async (event) => {
    const { uid } = event.params;
    const data = event.data?.data();
    if (!data || data.read) return null;

    const db = getFirestore();
    const userSnap = await db.doc(`users/${uid}`).get();
    const pushSub = userSnap.data()?.pushSubscription;
    if (!pushSub) return null;

    const payload = JSON.stringify({
      title: `Erfolg von ${data.fromName}`,
      body: `${data.fromName} hat „${data.workoutName}" abgeschlossen!`,
    });

    try {
      await webpush.sendNotification(pushSub, payload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.doc(`users/${uid}`).update({ pushSubscription: FieldValue.delete() });
      }
    }
    return null;
  }
);
