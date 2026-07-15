const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative w-full">
      <div className="w-full max-w-[104rem] mx-auto px-8">
        <div className="mt-12 mb-2 lg:mt-0 flex w-full flex-col items-center justify-center border-t border-gray-200 py-4 md:flex-row md:justify-between">
          <span className="mb-4 text-center text-sm font-normal text-gray-900 md:mb-0">
            &copy; {currentYear} DocScout. All Rights Reserved.
          </span>
          <span className="text-sm font-normal text-gray-900">
            Made with ❤️ by Jimut
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
