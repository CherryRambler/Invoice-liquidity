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
            <h2>Business dashboard</h2>

            <form className="card" onSubmit={handleSubmit}>
                <div className="field">
                    <label>Business name</label>
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label>Invoice amount (₹)</label>
                    <input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label>Due date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="primary">Submit invoice</button>
            </form>

            <h3>Your invoices</h3>
            {invoices.length === 0 && <p className="muted">No invoices yet.</p>}

            {invoices.map((invoice) => (
                <div className="card" key={invoice._id}>
                    <div className="row">
                        <strong>{invoice.businessName}</strong>
                        <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
                    </div>

                    <p className="muted">
                        ₹{invoice.invoiceAmount.toLocaleString('en-IN')} · due {invoice.dueDate.slice(0, 10)}
                    </p>

                    <div className="button-row">
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
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BusinessDashboard;