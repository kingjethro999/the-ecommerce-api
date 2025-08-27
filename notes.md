```const { data, error } = await resend.emails.send({
        from: "Inventory Pro <info@desishub.com>",
        to: email,
        subject: "Verify your Account",
        react: VerifyEmail({ verificationCode }),
      });
```
