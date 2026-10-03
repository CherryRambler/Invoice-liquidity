const sendUpiPayment = (toName, amount) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: 'UPI' + Date.now(),
                paidTo: toName,
                amount: amount,
                paidAt: new Date(),
            });
        }, 800);
    });
};

module.exports = { sendUpiPayment };