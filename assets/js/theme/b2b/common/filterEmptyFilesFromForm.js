export default function (formData) {
    try {
        for (const [key, val] of formData) {
            if (val instanceof File && !val.name && !val.size) {
                formData.delete(key);
            }
        }
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
    return formData;
}
