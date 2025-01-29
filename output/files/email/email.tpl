<div id="template-email" style="background-color: #f5f5f5; padding: 40px 20px;">
    <div style="max-width: 600px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); 
                background-color: #ffffff; margin: 0 auto; padding: 30px; color: #333;
                font-family: 'Arial', sans-serif; font-size: 18px; line-height: 1.6; 
                border-top: 6px solid #000;">

        <table style="border: none; width: 100%;">
            <!-- Title Section -->
            <tr>
                <td style="padding-bottom: 20px; text-align: center;">
                    <h1 style="color: #000; font-size: 24px; font-weight: bold; margin: 0 0 10px; line-height: 1.4;">
                        {{{subject}}}
                    </h1>
                    <hr style="border: 0; height: 2px; background-color: #000; width: 80px; margin: 10px auto;">
                </td>
            </tr>

            <!-- Content Section -->
            <tr>
                <td style="padding: 20px 30px; color: #444; font-size: 16px; text-align: left;">
                    <div style="line-height: 1.6;">
                        {{{content}}}
                    </div>
                </td>
            </tr>

            <!-- Footer Section -->
            <tr>
                <td
                    style="color: #555; padding: 20px 0; text-align: center; font-size: 14px; border-top: 1px solid #ddd; margin-top: 20px;">
                    <strong style="font-size: 18px; color: #000;">{{appName}}</strong>
                    <p style="margin: 10px 0 0;">Thank you for choosing us!</p>
                </td>
            </tr>
        </table>
    </div>
</div>

<style>
    #template-email img {
        max-width: 100%;
        height: auto;
    }

    #template-email h1 {
        margin: 0;
    }

    #template-email p {
        margin: 0;
    }
</style>