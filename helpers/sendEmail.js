const ElasticEmail = require("@elasticemail/elasticemail-client");
require("dotenv").config();

const { ELASTICEMAIL_FROM, ELASTICEMAIL_FROM_API_KEY } = process.env;

const defaultClient = ElasticEmail.ApiClient.instance;

const { apikey } = defaultClient.authentications;
apikey.apiKey = ELASTICEMAIL_FROM_API_KEY;

const api = new ElasticEmail.EmailsApi();

// const email = ElasticEmail.EmailMessageData.constructFromObject({
//   Recipients: [new ElasticEmail.EmailRecipient("gimojot818@rdluxe.com")],
//   Content: {
//     Body: [
//       ElasticEmail.BodyPart.constructFromObject({
//         ContentType: "HTML",
//         Content: `<a target="_blank" href="http://localhost:3000/api/auth/verify/${verificationCode}">Click to verify email</a>`,
//       }),
//     ],
//     Subject: "Verify email",
//     From: ELASTICEMAIL_FROM,
//   },
// });

// const callback = function (error, data, response) {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log("API called successfully.");
//   }
// };
// api.emailsPost(email, callback);

const sendMail = async (recipientEmail, subject, htmlContent) => {
  const email = {
    Recipients: [new ElasticEmail.EmailRecipient(recipientEmail)],
    Content: {
      Body: [
        {
          ContentType: "HTML",
          Content: htmlContent,
        },
      ],
      Subject: subject,
      From: ELASTICEMAIL_FROM,
    },
  };
  return new Promise((resolve, reject) => {
    api.emailsPost(email, (error, data, response) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        console.log("Email sent successfully.");
        resolve(data);
      }
    });
  });
};

module.exports = sendMail;
