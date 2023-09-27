import urlHelper from './urlHelper';

const quoteCompanyUrls = ['pages/custom/page/quote/quote-detail', 'pages/custom/page/quote/create-quote'];

export default function (context) {
    const contextTemplate = context.template ? context.template : context.template_file;
    const pageTemplete = contextTemplate.replace(/\\/g, '/');
    const isClearQuoteCompany = quoteCompanyUrls.includes(pageTemplete);
    if (isClearQuoteCompany) {
        urlHelper.redirect('/login.php');
    }
}
