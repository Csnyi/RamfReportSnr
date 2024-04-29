/** Managing pop-up messages */

class sendMessage {
    constructor(id, text, prem, err, dt){
        this.id = id;
        this.text = text;
        this.prem = prem;
        this.err = err;
        this.dt = dt;
    }
    send () {
        if(this.prem){
          $(this.id).show('slow');
          $(this.id).html(this.text);
          setTimeout(() => {
              $(this.id).hide('slow');
          }, this.dt);
        }else{
          $("#alert").show('slow');
          $("#alert").html(this.err);
          setTimeout(() => {
              $("#alert").hide('slow');
          }, this.dt);
        }
    }
    view () {
        if(this.prem){
          $(this.id).html(this.text);
          $(this.id).show('slow');
        }else{
          $(this.id).hide('slow');
          $("#alert").show('slow');
          $("#alert").html(this.err);
          setTimeout(() => {
              $("#alert").hide('slow');
          }, this.dt);
        }
    }
};
