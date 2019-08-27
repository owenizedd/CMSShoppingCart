(function(){
  ClassicEditor.create(document.getElementById('ta'));

  $('.delete-page').click(()=>{
    if (!confirm("Are you sure to delete this page?")) return false;
  })
  $('.delete-category').click( ()=> {
    if (!confirm("Are you sure to delete this category?")) return false;
  })
}());