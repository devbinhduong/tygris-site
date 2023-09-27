export default class QuoteTotal {
    constructor(el, options) {
        this.$el = $(el);
        this.options = options;
    }

    update(options) {
        this.$el.find('#subtotal').html(options.subtotal);
        this.$el.find('#discount').html(options.discount);
        this.$el.find('#grand_total').html(options.grandTotal);
    }

    render() {
        const _html = this.content;
        this.$el.html(_html);
    }

    get content() {
        return `
            <div data-row data-row-end>
                <ul class="cart-totals">
                    <li class="cart-total">
                        <div class="cart-total-label">
                            <strong>Subtotal:</strong>
                        </div>
                        <div class="cart-total-value" id="subtotal">
                            ${this.options.subtotal}
                        </div>
                    </li>
                    <li class="cart-total">
                        <div class="cart-total-label">
                            <strong>Discount:</strong>
                        </div>
                        <div class="cart-total-value" id="discount">
                            ${this.options.discount}
                        </div>
                    </li>
                    <li class="cart-total">
                        <div class="cart-total-label">
                            <strong>Grand Total:</strong>
                        </div>
                        <div class="cart-total-value" id="grand_total">
                            ${this.options.grandTotal}
                        </div>
                    </li>
                </ul>
            </div>
        `;
    }
}
