import { useLocation, Link } from 'react-router-dom';
import { formatPrice } from '../types';
import type { Order } from '../types';

export function OrderConfirmationPage() {
  const { state } = useLocation();
  const order = (state as { order?: Order })?.order;

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🤔</p>
        <p className="text-xl text-gray-500 mb-4">Тапсырыс табылмады</p>
        <Link to="/products" className="text-blue-600 hover:underline">Өнімдерге оралу →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Тапсырыс қабылданды!</h1>
        <p className="text-gray-500 mt-2">Тапсырыс нөмірі: <span className="font-mono font-bold text-blue-600">{order.orderNumber}</span></p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Тапсырыс мәліметтері</h2>
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="font-medium">{item.productTitle}</p>
              <p className="text-sm text-gray-400">{item.variantSku} × {item.quantity}</p>
            </div>
            <p className="font-medium">{formatPrice(item.totalPriceTiyin)}</p>
          </div>
        ))}
        <div className="flex justify-between pt-4 mt-2 border-t-2 border-gray-100">
          <span className="text-lg font-bold">Жалпы:</span>
          <span className="text-lg font-bold text-blue-600">{formatPrice(order.totalTiyin)}</span>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/products" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition inline-block">
          Тағы сатып алу →
        </Link>
      </div>
    </div>
  );
}
