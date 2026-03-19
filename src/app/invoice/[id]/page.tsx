import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { PrintReceiptButton } from './PrintButton'

export default async function InvoicePage(
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params

    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            items: {
                include: { product: true }
            },
            supermarket: true,
            customer: true
        }
    })

    if (!sale) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:max-w-none text-slate-800">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 text-center">
                    <h1 className="text-2xl font-black tracking-widest uppercase">{sale.supermarket.name}</h1>
                    {sale.supermarket.address && <p className="text-sm text-slate-400 mt-1">{sale.supermarket.address}</p>}
                    {sale.supermarket.phone && <p className="text-sm text-slate-400">Ph: {sale.supermarket.phone}</p>}
                </div>
                
                {/* Invoice Meta */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start text-sm">
                    <div>
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Receipt No</p>
                        <p className="font-mono font-bold text-slate-900">#{sale.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Date</p>
                        <p className="font-bold text-slate-900">{new Date(sale.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    </div>
                </div>

                {/* Customer Details */}
                {sale.customer && (
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-sm">
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Billed To</p>
                        <p className="font-bold">{sale.customer.name}</p>
                        {sale.customer.flatNumber && <p className="text-slate-600">Flat: {sale.customer.flatNumber}</p>}
                        {sale.customer.phone && <p className="text-slate-600">Ph: {sale.customer.phone}</p>}
                    </div>
                )}

                {/* Items */}
                <div className="p-6">
                    <table className="w-full text-sm">
                        <thead className="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                            <tr>
                                <th className="text-left pb-3">Item</th>
                                <th className="text-center pb-3">Qty</th>
                                <th className="text-right pb-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sale.items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-3">
                                        <p className="font-bold text-slate-900">{item.product.name}</p>
                                        <p className="text-xs text-slate-500">{formatCurrency(Number(item.unitPrice))}</p>
                                    </td>
                                    <td className="py-3 text-center text-slate-600 font-medium">
                                        {Number(item.quantity).toString()} {item.product.unit}
                                    </td>
                                    <td className="py-3 text-right font-bold text-slate-900">
                                        {formatCurrency(Number(item.total))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Total */}
                <div className="bg-slate-50 p-6 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600 font-bold">Subtotal</span>
                        <span className="font-bold text-slate-900">{formatCurrency(Number(sale.subTotal))}</span>
                    </div>
                    {Number(sale.taxTotal) > 0 && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-600 font-bold">Tax</span>
                            <span className="font-bold text-slate-900">{formatCurrency(Number(sale.taxTotal))}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                        <span className="text-lg font-black uppercase tracking-widest text-slate-900">Total</span>
                        <span className="text-2xl font-black text-green-600">{formatCurrency(Number(sale.totalAmount))}</span>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span>Payment Mode</span>
                        <span className="bg-slate-200 px-2 py-1 rounded text-slate-700">{sale.paymentMode}</span>
                    </div>
                </div>

                {/* Print Button (Hidden in print) */}
                <div className="p-6 pt-0 bg-slate-50 text-center print:hidden">
                    <PrintReceiptButton />
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { background: white; margin: 0; padding: 10px; }
                }
            `}} />
        </div>
    )
}
