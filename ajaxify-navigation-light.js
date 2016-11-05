var ajaxifier = {
	isHistoryAvailable: true,
	ajaxLinks: 'a:not(.noAjax)',
	noAjaxLinks: '.noAjax',
	forceQuitClass: 'forceQuit',
	refreshContent: '#maincontent',
    refreshMenu: function() {},

	init:function(options) {
		options = $.extend(
		{
			ajaxLinks : this.ajaxLinks, 
			tabLink : this.tabLink,
			noAjaxLinks: this.noAjaxLinks,
			forceQuitClass: this.forceQuitClass,
			refreshContent : this.refreshContent,
			refreshModalContent: this.refreshModalContent,
            refreshMenu: this.refreshMenu,
		}, options);

		this.ajaxLinks = options.ajaxLinks;
		this.noAjaxLinks = options.noAjaxLinks;
		this.forceQuitClass = options.forceQuitClass;
		this.refreshContent = options.refreshContent;
        this.refreshMenu = options.refreshMenu;


		ajaxifier.initHistory();



 		/*
  		================================================================================================
  			Déclaration des handlers de la page
  		================================================================================================
  		*/

		// Alert avant de quitter l'application
		$(window).bind('beforeunload', function(){
			return "Fermeture de l'application";
		});

		// Pour quitter la page sans confirmation pour les liens
		$("body").delegate("a."+ajaxifier.forceQuitClass, "click", function(e) {
			$(window).unbind('beforeunload');
			return true;
		});
		// Pour quitter la page sans confirmation pour les form
		$("body").delegate("form."+ajaxifier.forceQuitClass, "submit", function(e) {
			e.stopPropagation();
			$(window).unbind('beforeunload');
			return true;
		});


		var processFormBody = function processFormBody(form, formData, extra, e) {


  			if (form.hasClass(ajaxifier.forceQuitClass)) {
  				return;
  			}
  			
  			e.preventDefault(); //Prevent the normal submission action
		

		    var link = form.attr('action');
		    //var formData = $this.serialize();

		    var processData = true;
		    var contentType = "application/x-www-form-urlencoded; charset=UTF-8";

	    	if (extra != null) {
				formData.push(extra);
	    	}

			// On essaye d'envoyer un formulaire avec une pièce jointe. Dans ce cas on utilise FormData
		    var encType = form.attr('enctype');
		    if (encType === "multipart/form-data") {
		    	formData = new FormData(form[0]);
		    	if (extra != null) {
					formData.append(extra.name, extra.value);
		    	}
		    	processData = false;
		    	contentType = false;
		    }

		    $.ajax({
                url: link, // Le nom du fichier indiqué dans le formulaire
                type: form.attr('method'), // La méthode indiquée dans le formulaire (get ou post)
                data: form.serialize(), // Je sérialise les données (j'envoie toutes les valeurs présentes dans le formulaire)
                data: formData,
      			processData: processData,
      			contentType: contentType,
                success: function(html, status, xhr) { // Je récupère la réponse
					ajaxifier.ajaxify(html, link, true);
					return false;
                }
            });

		};

		// Permet de capter les submit des formulaires
		$("body").delegate("form", "submit", function(e) {
			var form = $(this); // L'objet jQuery du formulaire
			var formData = form.serialize();
			return processFormBody(form, formData, null, e);
		});

		$("body").delegate("input[type='submit']", "click", function(e) {		
			var form = $(this).closest('form');
			var formData = form.serializeArray();
			return processFormBody(form, formData, { name: $(this).attr('name'), value: $(this).val() }, e);
		});


  		// Interception des click sur les liens de toute la page
  		$("body").delegate(ajaxifier.ajaxLinks, "click", function(e) {


			var link = $(this).attr('href');
			var $this = $(this); // L'objet jQuery du formulaire

	        if (typeof link == typeof undefined || link == false) {
	               return;
	        }
  			
  			if ($this.hasClass(ajaxifier.forceQuitClass)) {
  				return;
  			}

			if (link.indexOf("#") != -1) { // c'est un lien interne. On ne le gère pas
				return;
			}

			e.preventDefault();			

		    $.ajax({
                url: link, // Le nom du fichier indiqué dans le formulaire
                type: "GET", // La méthode indiquée dans le formulaire (get ou post)
                // Je sérialise les données (j'envoie toutes les valeurs présentes dans le formulaire)
                success: function(html, status, xhr) { // Je récupère la réponse
                	ajaxifier.ajaxify(html, link, true);
                },

			});	
		
	  	});


  		// Evenement back navigateur pour restaurer l'état précédent de l'historique
  		
  		window.onpopstate = function(event) {
  			console.log("Back history");
  			console.log(event.state);
  			var query = document.location.pathname + document.location.search;

  			if (document.location.hash != "") { // pour ne pas restaurer un état SPA
  				ajaxifier.refreshMenu(query + document.location.hash);
  				return;
  			}

  			console.log(query);
  			if (event.state != null) {
				// On recharge la page depuis le serveur
				ajaxifier.loadFromServer(query);
			} else {
				// On recharge la page depuis le serveur
				ajaxifier.loadFromServer(document.location.pathname);
  			}
  		}
  		

	},



	/*
	================================================================================================
		Déclaration des méthodes
	================================================================================================
	*/

	
	loadFromServer: function loadFromServer(url) {
			$.get( url, function( html ) {
				console.log("reload from server:" + url);
				ajaxifier.ajaxify(html, url, false); // on n'ajoute pas de nouveau à l'historique
				return false;
			}).error(function(jqXHR, textStatus, errorThrown) {
                if (textStatus == 'timeout')
                    console.log('The server is not responding');

                if (textStatus == 'error')
                    console.log(errorThrown);

            });

	},

	initHistory: function initHistory() {
  		// Gestion de l'historique
  		ajaxifier.isHistoryAvailable = true;
  		if (typeof history.pushState === "undefined") {
  			ajaxifier.isHistoryAvailable = false;
  		} else {
  			var query = document.location.pathname + document.location.search;
  			console.log("Push initial state: " + $(document).prop('title') + ", " + query);
  			history.pushState({}, $(document).prop('title'), query); //url	
  		}			
	},
  		
	reloadScripts: function reloadScripts(html) {
		// Reload scripts
    	var scripts = $(html).find("script");
    	
		$(scripts).each(function(index) {
			try {
				$("head").append(scripts[index].outerHTML);	
			} catch(e) {
				console.log("inline JS error");
				console.log(e);
				$("head").children().last().remove();
			}			
		});

	},
		
	changeContent: function changeContent(html) {

		var data = $(html).find(ajaxifier.refreshContent).children();
		var currentNode = $( ajaxifier.refreshContent )[0];

		// Clean children nodes
		while (currentNode.hasChildNodes()) { 
			currentNode.removeChild(currentNode.lastChild);
		}
		
		// Ajout du nouveau DOM 
		for (i = 0; i < data.size(); i++) { 
			currentNode.appendChild(data[i]);
		}

		//TODO aria role here?
    },


	mergeHeadElement:function mergeHeadElement(currentHead, attr) {
    	var isAttrExist = true;
    	if (typeof attr.outerHTML === "undefined") {
    		isAttrExist = false;
    	}

    	// on évite le title
    	if (isAttrExist && attr.outerHTML.indexOf("title") != -1) {
    		return;
    	}

    	// Add new head element if not exist
		  var exist = false;
		  $(currentHead).each(function(item) {
			  if (attr.outerHTML === currentHead[item].outerHTML) {
				  exist = true;
				  return;
			  }
		  });
		  
		  if (exist == false) {
			  if (attr.outerHTML) {
				    console.log("add:" + attr.outerHTML);
				    // charge dynamiquement les ressources
			    	$("head").append(attr.outerHTML);	
			  }
		  }

    },

	extractHead: function extractHead(html) {
		  var regExp = /<head>([\s\S]*?)<\/head>/gm;
		  var matches = regExp.exec(html);
		  var newHead = $(matches[1]);
		  return newHead;
    },
		    
	replaceTitle: function replaceTitle(title) {
		$(document).prop('title', title);
		console.log("change title:" + title);
    },


	ajaxify: function ajaxify(html, link, addToHistory) {

        var myEvent = new CustomEvent("beforeAjaxifyChange");
        document.body.dispatchEvent(myEvent);

		
		if (html == "") {
			return;
		}

		// Extract head infos
		var newHead = ajaxifier.extractHead(html);
		var currentHead = $("head").children();
		var title = $(html).filter('title').text();

		// Merge head elements (only title)
		$(newHead).each(function() {
			ajaxifier.mergeHeadElement(currentHead, $(this)[0]);						  
		});					  


		// On remplace le titre de la page
		ajaxifier.replaceTitle(title);

		// Remplacement du corps de la page
		ajaxifier.changeContent(html);

		// Rafraichissement du menu
		ajaxifier.refreshMenu(link);

		// Execution du JS inline de la page
		ajaxifier.reloadScripts($( ajaxifier.refreshContent )[0]);
		console.log("init inline JS");


		// Modification de l'historique
		if (ajaxifier.isHistoryAvailable && addToHistory) {
			console.log("Push State: " + title + ", " + link);
			history.pushState({}, title, link); //url	
		}

		// scroll top (fix pour recalculer la hauteur de la scrollbar)
		 $(window).scrollTop(1);
		 $(window).scrollTop(0);
		 
		 // Auto focus si la nouvelle page le demande 
		 $("input[autofocus]").focus();
    },

};

