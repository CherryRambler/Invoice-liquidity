import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const ACTIONS = {
    pending: { action: 'verify', label: 'Verify invoice' },
    verified: { action: 'tokenize', label: 'Tokenize invoice' },
    tokenized: { action: 'payout', label: 'Receive funds' },
    funded: { action: 'repay', label: 'Simulate client repayment' },
};

// Verification needs a due date in the future, so tomorrow is the earliest useful one.
const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-CA');
};

function BusinessDashboard() {
    const [invoices, setInvoices] = useState([]);
    const [gstin, setGstin] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchInvoices = () => {
        apiClient.get('/invoices')
            .then((response) => {
                setInvoices(response.data);
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Could not load invoices');
            });
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        apiClient.post('/invoices', {
            gstin,
            invoiceAmount: Number(invoiceAmount),
            dueDate,
        })
            .then(() => {
                setGstin('');
                setInvoiceAmount('');
                setDueDate('');
                fetchInvoices();
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Could not create invoice');
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    const handleAction = (invoiceId, action) => {
        setError('');
        setBusyId(invoiceId);

        apiClient.post(`/invoices/${invoiceId}/${action}`)
            .then(() => {
                fetchInvoices();
            })
            .catch((error) => {
                setError(error.response?.data?.message || `Failed to ${action}`);
                fetchInvoices();
            })
            .finally(() => {
                setBusyId(null);
            });
    };

    return (
        <div>
            <h2>Business dashboard</h2>

            <form className="card" onSubmit={handleSubmit}>
                <div className="field">
                    <label>GSTIN (15 characters)</label>
                    <input
                        type="text"
                        value={gstin}
                        minLength={15}
                        maxLength={15}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        required
                    />
                </div>

                <div className="field">
                    <label>Invoice amount (₹)</label>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label>Due date</label>
                    <input
                        type="date"
                        min={tomorrow()}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit invoice'}
                </button>
            </form>

            {error && <p className="error-text">{error}</p>}

            <h3>Your invoices</h3>
            {invoices.length === 0 && <p className="muted">No invoices yet.</p>}

            {invoices.map((invoice) => {
                const next = ACTIONS[invoice.status];
                const funding = invoice.funding;
                const awaitingFunding = invoice.status === 'tokenized' && !funding?.isFullyFunded;

                return (
                    <div className="card" key={invoice._id}>
                        <div className="row">
                            <strong>{invoice.businessName}</strong>
                            <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
                        </div>

                        <p className="muted">
                            ₹{invoice.invoiceAmount.toLocaleString('en-IN')} · due {invoice.dueDate.slice(0, 10)}
                            {invoice.gstin && ` · GSTIN ${invoice.gstin}`}
                        </p>

                        {invoice.status === 'tokenized' && funding && (
                            <>
                                <div className="progress">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min(funding.amountFunded / funding.totalValue, 1) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="muted">
                                    ₹{funding.amountFunded.toLocaleString('en-IN')} of ₹{funding.totalValue.toLocaleString('en-IN')} raised from investors
                                </p>
                            </>
                        )}

                        {next && (
                            <div className="button-row">
                                <button
                                    disabled={busyId === invoice._id || awaitingFunding}
                                    onClick={() => handleAction(invoice._id, next.action)}
                                >
                                    {busyId === invoice._id
                                        ? 'Processing...'
                                        : awaitingFunding ? 'Waiting for investors' : next.label}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default BusinessDashboard;
