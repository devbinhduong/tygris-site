import checkB2bUser from './checkB2bUser';
import urlHelper from './urlHelper';

export default function () {
    const isB2bUser = checkB2bUser();
    if (!isB2bUser) {
        window.b2b.Alert.error('You can\'t access to this page.');
        urlHelper.redirect('/');
    }
}
