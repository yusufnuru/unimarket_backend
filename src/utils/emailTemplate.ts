/* eslint-disable @stylistic/max-len */
export const getPasswordResetTemplate = (url: string) => ({
  subject: 'Password Reset Request',
  text: `You requested a password reset. Click on the link to reset your password: ${url}`,
  html: `<!doctype html><html lang="en-US"><head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"/><title>Reset Password Email Template</title><meta name="description" content="Reset Password Email Template."><style type="text/css">a:hover{text-decoration:underline!important}</style></head><body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0"><!--100%body table--><table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;"><tr><td><table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0"><tr><td style="height:80px;">&nbsp;</td></tr><tr><td style="text-align:center;"></a></td></tr><tr><td style="height:20px;">&nbsp;</td></tr><tr><td><table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);"><tr><td style="height:40px;">&nbsp;</td></tr><tr><td style="padding:0 35px;"><h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have requested to reset your password</h1><span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span><p style="color:#455056; font-size:15px;line-height:24px; margin:0;">A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.</p><a target="_blank" href="${url}" style="background:#2f89ff;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset Password</a></td></tr><tr><td style="height:40px;">&nbsp;</td></tr></table></td><tr><td style="height:20px;">&nbsp;</td></tr><tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr><tr><td style="height:80px;">&nbsp;</td></tr></table></td></tr></table><!--/100%body table--></body></html>`,
});

export const getVerifyEmailTemplate = (url: string) => ({
  subject: 'Verify Email Address',
  text: `Click on the link to verify your email address: ${url}`,

  html: `<!doctype html><html lang="en-US"><head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>\n<title>Verify Email Address Email Template</title><meta name="description" content="Verify Email Address Email Template.">\n<style type="text/css">a:hover{text-decoration:underline!important}</style></head><body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">\n<!--100%body table--><table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); \nfont-family: 'Open Sans', sans-serif;"><tr><td><table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0"><tr><td style="height:80px;">&nbsp;</td></tr><tr><td style="text-align:center;"></a></td></tr><tr><td style="height:20px;">&nbsp;</td></tr><tr><td><table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);"><tr><td style="height:40px;">&nbsp;</td></tr><tr><td style="padding:0 35px;"><h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Please verify your email address</h1><span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span><p style="color:#455056; font-size:15px;line-height:24px; margin:0;">Click on the following link to verify your email address.</p><a target="_blank" href="${url}" style="background:#2f89ff;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Verify Email Address</a></td></tr><tr><td style="height:40px;">&nbsp;</td></tr></table></td><tr><td style="height:20px;">&nbsp;</td></tr><tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr><tr><td style="height:80px;">&nbsp;</td></tr></table></td></tr></table><!--/100%body table--></body></html>`,
});

type WarningEmailParams = {
  productName: string;
  storeName: string;
  price: string;
  description?: string;
  quantity: number;
  reason: string;
  actionTaken: string;
  productUrl: string;
};

export const getWarningEmailTemplate = ({
  productName,
  storeName,
  price,
  description,
  quantity,
  reason,
  actionTaken,
  productUrl,
}: WarningEmailParams) => ({
  subject: 'Important: Product Warning Notice',
  text: `
  Your product "${productName}" from store "${storeName}" has received a warning.

  Details:
  - Price: ${price}
  - Description: ${description}
  - Quantity: ${quantity}
  - Reason: ${reason}
  - Action Taken: ${actionTaken}

  Please review your product here: ${productUrl}
  `,
  html: `
  <!doctype html>
  <html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <title>Product Warning Notification</title>
    <style>
      body { font-family: 'Open Sans', sans-serif; background-color: #f9f9f9; padding: 20px; }
      .container { background: #fff; border-radius: 8px; padding: 20px; max-width: 600px; margin: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      h2 { color: #d9534f; }
      p { line-height: 1.6; }
      .btn { display: inline-block; padding: 10px 20px; background: #2f89ff; color: #fff; border-radius: 5px; text-decoration: none; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Warning: Your Product Requires Attention</h2>
      <p><strong>Product Name:</strong> ${productName}</p>
      <p><strong>Store Name:</strong> ${storeName}</p>
      <p><strong>Price:</strong> ${price}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Reason for Warning:</strong> ${reason}</p>
      <p><strong>Action Taken:</strong> ${actionTaken}</p>
      <a href="${productUrl}" class="btn" target="_blank">View Product</a>
    </div>
  </body>
  </html>
  `,
});
