export default function LeftMenu() {
    const items = [
      { label: 'HOME', href: '/' },
      { label: 'TRAIN', href: '/train' },
      { label: 'COMPANIES', href: '/companies' },
      { label: 'ACCOUNT', href: '/account' },
    ];
  
    return (
      <nav className="fixed left-6 top-1/2 -translate-y-1/2 select-none z-50">
        <ul className="space-y-4 text-base md:text-lg font-medium text-black/70">
          {items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="group inline-flex items-center hover:text-black transition-colors"
              >
                <span className="mr-3 text-black/50 transition-transform duration-200 group-hover:translate-x-1">-</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  
  
  