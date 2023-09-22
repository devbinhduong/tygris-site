import classie from 'classie';

export default function() {
    const layout = document.getElementById('grid-list-layout');

    console.log(layout)
    $(document).on('click', '.view-as-btn a', function(){
        var column = $(this).attr('data-layout');
        layout.className = 'page';
        classie.add(layout, column);
    });
}
