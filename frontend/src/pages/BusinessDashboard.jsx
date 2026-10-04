import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function BusinessDashboard() {
    const [invoices, setInvoices] = useState([]);
    const [businessName, setBusinessName] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    const fetchInvoices = () => {
        apiClient.get('/invoices')
            .then((response) => {
                setInvoices(response.data);
            })
            .catch((error) => {
                console.error('Error fetching invoices:', error);
            });
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        apiClient.post('/invoices', {
            businessName,
            invoiceAmount: Number(invoiceAmount),
            dueDate,
        })
            .then(() => {
                setBusinessName('');
                setInvoiceAmount('');
                setDueDate('');
                fetchInvoices();
            })
            .catch((error) => {
                console.error('Error creating invoice:', error);
            });
    };

    const handleAction = (invoiceId, action) => {
        apiClient.post(`/invoices/${invoiceId}/${action}`)
            .then(() => {
                fetchInvoices();
            })
            .catch((error) => {
                alert(error.response?.data?.message || `Failed to ${action}`);
            });
    };

    return (
        <div>
            <h1>Business dashboard</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Business name</label>
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Invoice amount</label>
                    <input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Due date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Submit invoice</button>
            </form>

            <h2>Your invoices</h2>
            <ul>
                {invoices.map((invoice) => (
                    <li key={invoice._id}>
                        {invoice.businessName} — ₹{invoice.invoiceAmount} — due {invoice.dueDate.slice(0, 10)} — status: {invoice.status}{' '}

                        {invoice.status === 'pending' && (
                            <button onClick={() => handleAction(invoice._id, 'tokenize')}>
                                Verify and tokenize
                            </button>
                        )}

                        {invoice.status === 'tokenized' && (
                            <button onClick={() => handleAction(invoice._id, 'payout')}>
                                Receive funds
                            </button>
                        )}

                        {invoice.status === 'funded' && (
                            <button onClick={() => handleAction(invoice._id, 'repay')}>
                                Simulate client repayment
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BusinessDashboard;