export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">TechShop KZ</h3>
            <p className="text-sm">Қазақстандағы жаңа ұрпақ интернет-дүкен платформасы</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Қызметтер</h4>
            <ul className="space-y-1 text-sm">
              <li>Kaspi Pay төлемі</li>
              <li>Халық Банк төлемі</li>
              <li>Қамтамасыз ету</li>
              <li>Жеткізу</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Байланыс</h4>
            <ul className="space-y-1 text-sm">
              <li>support@techshop.kz</li>
              <li>+7 (727) 000-00-00</li>
              <li>Алматы, Қазақстан</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
          © 2026 TechShop KZ — ShopBuilder платформасында жасалған
        </div>
      </div>
    </footer>
  );
}
