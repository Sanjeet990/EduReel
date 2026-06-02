const crypto = require("crypto");
const User = require("../models/userModel");
const Plan = require("../models/planModel");

// @desc    Generate Hash for PayU
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { amount, productinfo, firstname, email, phone, planId } = req.body;
        console.log("Create Order Payload:", req.body);
        
        if (!amount || !productinfo || !firstname || !email || !planId) {
            console.log("Validation failed. Missing fields.");
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const key = process.env.PAYU_MERCHANT_KEY;
        const salt = process.env.PAYU_MERCHANT_SALT;
        const txnid = "TXN" + Date.now() + Math.floor(Math.random() * 1000);
        const udf1 = planId; // We store planId in udf1 to retrieve it in callback
        const udf2 = req.user._id.toString(); // Store userId in udf2

        // Hash Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
        const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${salt}`;
        
        const hash = crypto.createHash('sha512').update(hashString).digest('hex');

        res.json({
            success: true,
            data: {
                txnid,
                hash,
                key,
                udf1,
                udf2
            }
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Server error creating order" });
    }
};

// @desc    Handle PayU Callback
// @route   POST /api/payments/payu-callback
// @access  Public (Called by PayU)
const payuCallback = async (req, res) => {
    try {
        const {
            txnid, status, amount, productinfo, firstname, email, 
            udf1, udf2, hash, additionalCharges
        } = req.body;

        const key = process.env.PAYU_MERCHANT_KEY;
        const salt = process.env.PAYU_MERCHANT_SALT;

        // Reverse Hash Formula:
        // sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        
        // 9 empty fields between status and udf2 means 9 pipes:
        let hashString = `${salt}|${status}|||||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
        
        if (additionalCharges) {
            hashString = `${additionalCharges}|${hashString}`;
        }

        const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

        if (generatedHash === hash) {
            if (status === "success") {
                // Payment was successful
                const userId = udf2;
                const planId = udf1;

                const plan = await Plan.findById(planId);
                if (plan) {
                    const user = await User.findById(userId);
                    if (user) {
                        user.plan = plan._id;
                        // Calculate new expiry date
                        const now = new Date();
                        const expiry = new Date(now.setDate(now.getDate() + plan.durationDays));
                        user.planExpires = expiry;
                        user.trialActive = false; // Disable trial if they bought a plan
                        user.allowedDevices = plan.numberOfDevices;
                        await user.save();
                    }
                }
                
                // Return success URL to app (can be a deep link or web page)
                return res.redirect("/payment-success");
            } else {
                return res.redirect("/payment-failure");
            }
        } else {
            return res.status(400).send("Hash mismatch");
        }
    } catch (error) {
        console.error("PayU Callback Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { createOrder, payuCallback };
