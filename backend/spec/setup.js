// spec/setup.js
jest.mock('nodemailer', () => {
    return {
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
          callback(null, { response: 'Email sent' });
        })
      })
    };
  });