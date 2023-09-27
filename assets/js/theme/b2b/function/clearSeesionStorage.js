import removeSessionStorageItems from '../common/removeSessionStorageItems';

export default function () {
    removeSessionStorageItems(['roleId', 'companyId', 'userId', 'b2bToken', 'email', 'isBtcUser', 'SalerRep', 'companyStatus', 'salerFirstIn', 'companyName', 'quoteCompany']);
}
