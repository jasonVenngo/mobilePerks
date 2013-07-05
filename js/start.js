		var app_data = {
			//identifier key for the app
			public_key : "cb8b7401881a909a9b79ab23dfbce156b91734f1", 

			//identifier secret for the app
			public_secret : "d31ad95ee82200feca9fef138ddc3d56a38b884c",

			// API call URLs - Note: See api_url setting below
			api_url : "http://api.venngo.com/",
			login_url : "http://api.venngo.com/login/",
			home_url : "home/", 
			map_url : "map/", 
			map_credentials : 'Ap5N8TmQpbyyGAzRMR1yFkhtcgoOMVKO4ZM1WKdxl1wqHzJHlLSZgy0QJQXeuqXK',
			locations_url : "locations/",
			category_list_url : "category/list/",
			category_url : "category/",
			favourite_perk_url : "favourites/edit/",
			favourites_url : "favourites/",
			search_url : "search/",
			analytics_url : "analytics/",
			perk_url : "perk/",
			perk_more_url: "perk/more/",
			perk_use_url : "perk/use/",
			perk_confirm_url : "perk/use/confirm/",
			perk_location_url : "perk/location/",
			perk_terms_url : "perk/terms/",
			privacy_url: "privacy.html",
			terms_url: "terms.html"
		};
		
		function check_auth()
		{
			var user_data = null;
			
			var local_storage_supported = ( typeof( localStorage  ) != undefined );
			
			if ( local_storage_supported  )
				user_data = localStorage.getItem( 'user_data' );
			
			if ( ! local_storage_supported || ! user_data )
				$.mobile.changePage( '#pg_login', { transition: "slideup" } );
			
			return $.parseJSON( user_data );
		}
		
		$( "#pg_login" ).live(
			'pageinit',
			function( event ) 
			{
				if ( check_auth() )
					$.mobile.changePage( '#pg_welcome', { transition: "slideup" } );
					
				$( '#btn_auth' ).click(
					function( event )
					{
						$.mobile.showPageLoadingMsg( 
							'b', 
							'Authenticating...'
						);

						var authHeader = 'OAuth, public_key=' + app_data['public_key'] 
							+ ', public_secret=' + app_data['public_secret']
							+ ', auth_username=' + $( '#username' ).val()
							+ ', auth_password=' + $( '#passwd' ).val();
							
						$.ajax({
							url: app_data['login_url'], 
							beforeSend: function( xhr )
							{
								xhr.setRequestHeader( "Authorization", authHeader );
							},
							error: function( xhr, status, error )
							{
								alert( xhr.responseText + ' ' + status + ' ' + error );
							},
							dataType: 'json',
							success: function( data, status, xhr ) 
							{
								$.mobile.hidePageLoadingMsg();
								
								if ( data.login == 'success' )
								{
									localStorage.setItem( 'user_data', JSON.stringify( data ) );
									
									$.mobile.changePage( '#pg_welcome', { transition: "slideup" } );
								}
							}
						});
					}
				);
			}
		);
		
		$( "#pg_welcome" ).live(
			'pageinit',
			function( event ) 
			{
				var user_data = check_auth();
				
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Finding Location...'
				);
				
				$( '#btn_start' ).hide();
				
				$( '#site_logo' ).attr( 'src', user_data.site_logo );
				
				if ( navigator.geolocation )
				{
  					navigator.geolocation.getCurrentPosition(
    					function( position )
    					{
							user_data.location_label = 'GPS';
							user_data.location_latitude = position.coords.latitude;
							user_data.location_longitude = position.coords.longitude;
							user_data.location_range = 50;
							
							localStorage.setItem( 'user_data', JSON.stringify( user_data ) );

							$( '#txt_location' ).text( 'Currently showing perks using your ' + user_data.location_label + ' location.' );
				
							$.mobile.hidePageLoadingMsg();
				
							$( '#btn_start' ).show();
    					}, 
    					function( error )
    					{
							$( '#txt_location' ).text( 'Currently showing perks using your ' + user_data.location_label + ' location.' );
				
							$.mobile.hidePageLoadingMsg();
				
							$( '#btn_start' ).show();
    					},
    					{
    						enableHighAccuracy: true, 
    						timeout: 2 * 1000 * 1000, 
    						maximumAge: 0 
    					}
  					);
				}
				else
				{
					$( '#txt_location' ).text( 'Currently showing perks using your ' + user_data.location_label + ' location.' );
				
					$.mobile.hidePageLoadingMsg();
				
					$( '#btn_start' ).show();
				}
				
				$( '#btn_start' ).click(
					function( event )
					{
						$.mobile.changePage( '#pg_home', { transition: "slideup" } );
					}
				);
			}
		);
		
		$( "#pg_home" ).live(
			'pagebeforeshow',
			function( event ) 
			{
				var user_data = check_auth();
				
				var arr_perks = [];
				
				var search_query = null;
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'] ;

				$.mobile.showPageLoadingMsg( 
					'b', 
					'Finding Perks...'
				);
				
				$('#lst_tier1').empty();
				
				// Search Functionality	
				$( '#fld_search' ).keypress( function( e ) 
				{
				    if( e.which == 13 )
				    {
				    	$('#lst_tier1').empty();
				    	
				    	search_query = $( '#fld_search' ).val()
				    	
				    	$.ajax({
				        	type: 'POST',
				        	url: app_data['api_url'] + app_data['search_url'] + '/0/',
				        	data: { 
				        		search_query: search_query,
				        		longitude: user_data.location_longitude,
								latitude: user_data.location_latitude,
								range: user_data.location_range,
								perk_list: arr_perks.join()
				        	},
				        	beforeSend: function( xhr )
				        	{
				        		xhr.setRequestHeader( "Authorization", authHeader );
				        	},
				        	error: function( xhr, status, error )
				        	{
				        		if ( xhr.status == 401 )
				        		{
				        			$.mobile.changePage( '#dlg_expired' );
				        		}
				        	},
				        	dataType: 'json',
				        	success: function( data )
				        	{
				        		$.each(
				        			data,
				        			function( index, perk )
				        			{
				        				var style = null;
										
										if ( index == 0 )
											style = 'style="background: url( http://cache.venngo.com/global/tier1/' + perk.folder + '/images/featureMobileGradient.jpg );"';
										
										$( '#lst_tier1' ).append( '<li data-identity="' + perk.perk_id + '" ' + style + '><a href="#pg_detail"><img src="' + perk.logo + '" /><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
										
										arr_perks.push( perk.perk_id );
				        			}
				        		);
				        		
				        		if ( data.length > 0 )
									$( '#lst_tier1' ).append( '<li class="show_me_more"><a href="#"><h3>Show me more perks</h3></a></li>' );
								
								$( "#lst_tier1" ).listview( "refresh" );

								$( '#lst_tier1 li' ).click(
									function( event )
									{
										if ( $( this ).hasClass( 'show_me_more' ) )
										{
											$( this ).remove();
											
											$.mobile.showPageLoadingMsg( 
												'b', 
												'Finding Perks...'
											);
												
											$.ajax({
												type: 'POST',
												url: app_data['api_url'] + app_data['home_url'],
												data: {
									    			longitude: user_data.location_longitude,
													latitude: user_data.location_latitude,
													range: user_data.location_range,
													perk_list: arr_perks.join()
									    		},
												beforeSend: function( xhr )
												{
													xhr.setRequestHeader( "Authorization", authHeader );
												},
												error: function( xhr, status, error )
												{
													alert( xhr.responseText + ' ' + status + ' ' + error );
												},
												dataType: 'json',
												success: function( data ) 
												{
													$.each( 
														data,
														function( index, perk )
														{
															$( '#lst_tier1' ).append( '<li data-identity="' + perk.perk_id + '"><a href="#pg_detail"><img src="' + perk.logo + '" /><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
															
															arr_perks.push( perk.perk_id );
														}
													);
													
													$( "#lst_tier1" ).listview( "refresh" );

													$.mobile.hidePageLoadingMsg();
												}
											});
										}
										else
										{
											$( '#pg_detail' ).data( 'identity', $( this ).data( "identity" ) );
										
											$( '#pg_detail_title' ).text( $( this ).find( 'h3' ).text() );
										}
									}
								);
								
								$.mobile.hidePageLoadingMsg();
				        	}
				        });
				    }
				});
				
				$.ajax({
					type: 'POST',
					url: app_data['api_url'] + app_data['home_url'],
					data: {
		    			longitude: user_data.location_longitude,
						latitude: user_data.location_latitude,
						range: user_data.location_range,
						perk_list: []
		    		},
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( data ) 
					{
						$.each( 
							data,
							function( index, perk )
							{
								var style = null;
								
								if ( index == 0 )
									style = 'style="background: url( http://cache.venngo.com/global/tier1/' + perk.folder + '/images/featureMobileGradient.jpg );"';
								
								$( '#lst_tier1' ).append( '<li data-identity="' + perk.perk_id + '" ' + style + '><a href="#pg_detail"><img src="' + perk.logo + '" /><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
								
								arr_perks.push( perk.perk_id );
							}
						);
						
						if ( data.length > 0 )
							$( '#lst_tier1' ).append( '<li class="show_me_more"><a href="#"><h3>Show me more perks</h3></a></li>' );
						
						$( "#lst_tier1" ).listview( "refresh" );

						$( '#lst_tier1 li' ).click(
							function( event )
							{
								if ( $( this ).hasClass( 'show_me_more' ) )
								{
									$( this ).remove();
									
									$.mobile.showPageLoadingMsg( 
										'b', 
										'Finding Perks...'
									);
										
									$.ajax({
										type: 'POST',
										url: app_data['api_url'] + app_data['home_url'],
										data: {
							    			longitude: user_data.location_longitude,
											latitude: user_data.location_latitude,
											range: user_data.location_range,
											perk_list: arr_perks.join()
							    		},
										beforeSend: function( xhr )
										{
											xhr.setRequestHeader( "Authorization", authHeader );
										},
										error: function( xhr, status, error )
										{
											alert( xhr.responseText + ' ' + status + ' ' + error );
										},
										dataType: 'json',
										success: function( data ) 
										{
											$.each( 
												data,
												function( index, perk )
												{
													$( '#lst_tier1' ).append( '<li data-identity="' + perk.perk_id + '"><a href="#pg_detail"><img src="' + perk.logo + '" /><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
													
													arr_perks.push( perk.perk_id );
												}
											);
											
											$( "#lst_tier1" ).listview( "refresh" );

											$.mobile.hidePageLoadingMsg();
										}
									});
								}
								else
								{
									$( '#pg_detail' ).data( 'identity', $( this ).data( "identity" ) );
								
									$( '#pg_detail_title' ).text( $( this ).find( 'h3' ).text() );
								}
							}
						);

						$.mobile.hidePageLoadingMsg();
					}
				});
			}
		);
		
		$( "#pg_map" ).live(
			'pageinit',
			function( event ) 
			{
				var user_data = check_auth();
				
				var infowindow;
								
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'] ;
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Finding Perks...'
				);
				
				$( '#map_canvas' ).height( $( document ).height() - $( '#map_canvas' ).position().top - 30 );

				var map = new google.maps.Map(
					document.getElementById("map_canvas"),
					{
						center: new google.maps.LatLng( user_data.location_latitude, user_data.location_longitude ),
						mapTypeId: google.maps.MapTypeId.ROADMAP,
						zoom: 12
					}
				);

				$.ajax({
					type: 'POST',
					url: app_data['api_url'] + app_data['map_url'],
					data: {
		    				longitude: user_data.location_longitude,
						latitude: user_data.location_latitude,
						range: user_data.location_range
		    		},
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( data ) 
					{
        				new google.maps.Marker({
      						position: new google.maps.LatLng( user_data.location_latitude, user_data.location_longitude ),
      						map: map
  						});
        				
        				google.maps.event.trigger(map, 'resize');

						$.each(
							data, 
							function ( index, perk ) 
							{
		        				var marker = new google.maps.Marker({
      								position: new google.maps.LatLng( perk.latitude, perk.longitude ),
      								map: map,
      								title: '<a href="#pg_detail">' + perk.title + '</a>'
		  						});

								google.maps.event.addListener(
									marker, 
									'click', 
									function( event )
									{
										if( !infowindow ) {
											infowindow = new google.maps.InfoWindow();
										}
										
										infowindow.setContent('<div style="float: left;"><a href="#pg_detail"><img src="' + perk.logo + '" width="60" /></a></div><div style="float: right;">' + perk.title + '<br /><a href="#pg_detail">' + perk.address_1 + ', ' + perk.prov + '</a></div>');
										
										infowindow.open( map, marker );
									}
								);
							}
						);
						
						$.mobile.hidePageLoadingMsg();
					}
				});
			}
		);
		
		$( "#pg_cats" ).live(
			'pagebeforeshow',
			function( event ) 
			{
				var user_data = check_auth();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'] ;
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Finding Categories...'
				);
				
				$.ajax({
					url: app_data['api_url'] + app_data['category_list_url'], 
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( data ) 
					{
						$.each( 
							data,
							function( index, category )
							{
								$( '#lst_cats' ).append( '<li data-identity="' + category.category_id + '"><a href="#" id="' + category.category_id + '"><img src="http://api.venngo.com/start/images/app/categories/icon' + category.category_key + '_jumbo.png" /><h3>' + category.long_name + '</h3></a></li>' );
							}
						);
						
						$( '#lst_cats li a' ).each(function() {
							var category_id = $( this ).attr( 'id' );
							
							$( document ).on('click', '#' + category_id, function(event) {
								if(event.handled !== true) {
									listObject.cat_id = category_id;
									
									$.mobile.changePage( "#pg_clist", { transition: "slide"} );
									event.handled = true;
								}
							});
						});
						
						$.mobile.hidePageLoadingMsg();
						
						$( "#lst_cats" ).listview( "refresh" );
					}
				});				
			}
		);
		
		var listObject = {
			cat_id : null
		}
		
		$( '#pg_clist' ).live(
			'pagebeforeshow',
			function( event )
			{
				$( '#lst_clist' ).empty();
				
				var user_data = check_auth();
				
				if( listObject.cat_id == undefined )
					history.back();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token + ', public_key=' + app_data['public_key'] + ', public_secret=' + app_data['public_secret'];
				
				$.mobile.showPageLoadingMsg( 
						'b', 
						'Finding Perks...'
					);
				
				$.ajax(
				{
					type: 'POST',
					url: app_data['api_url'] + app_data['category_url'] + listObject.cat_id + '/0/',
					data: {
		    			longitude: user_data.location_longitude,
						latitude: user_data.location_latitude,
						range: user_data.location_range,
					},
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						alert( xhr.responseText + ' ' + status + ' ' + error );
					},
					dataType: 'json',
					success: function( data )
					{
						$.each(	data, function( index, perk )
						{
							//console.log(perk);
							var style = null;
							
							if ( index == 0 && perk.tier == 1 )
								style = 'style="background: url( http://cache.venngo.com/global/tier1/' + perk.folder + '/images/featureMobileGradient.jpg );"';
							
							switch( parseInt(perk.tier) )
							{
								case 3:
									$( '#lst_clist' ).append( '<li class="tier_3" data-identity="' + perk.perk_id + '" ' + style + '><a href="#pg_detail"><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
									break;
								case 2:
									$( '#lst_clist' ).append( '<li class="tier_2" data-identity="' + perk.perk_id + '" ' + style + '><a href="#pg_detail"><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
									break;
								default:
									$( '#lst_clist' ).append( '<li class="tier_1" data-identity="' + perk.perk_id + '" ' + style + '><a href="#pg_detail"><img src="' + perk.logo + '" /><h3>' + perk.title + '</h3><p>' + perk.tagline + '</p></a></li>' );
							}
						}); //end each
						
						$( '#lst_clist li' ).click( function( event )
						{
							$( '#pg_detail' ).data( 'identity', $( this ).data( "identity" ) );
							
							$( '#pg_detail_title' ).text( $( this ).find( 'h3' ).text() );
						});
						
						$.mobile.hidePageLoadingMsg();
						
						$( "#lst_clist" ).listview( "refresh" );
					} //end success function
				});
			}
		);
		
		$( "#pg_detail" ).live(
			'pagebeforeshow',
			function( event ) 
			{
				var user_data = check_auth();
								
				if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
					history.back();	
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Perk Info...'
				);
				
				//$( '#redeem_group' ).empty();
				
				
				$( '#visa' ).hide();
				$( '#amex' ).hide();
				$( '#cash' ).hide();
				$( '#mastercard' ).hide();
				$( '#other' ).hide();
				$( '#interac' ).hide();
				
				
				$( '#store' ).hide();
				$( '#online' ).hide();
				$( '#phone' ).hide();
				$( '#email' ).hide();
				
				$( '#perk_locate' ).hide();
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['perk_more_url'] + $( '#pg_detail' ).data( 'identity' ) + '.json',
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( more_html ) 
					{
						$.each( more_html.service, function(i, item) {
							$( 'ul#features' ).append( '<li>' + item + '</li>' );
						} );
						
						if( more_html.tip )
						{
							$( '#tips' ).show();
							$.each( more_html.tip, function( i, item ) 
							{
								$( 'div#tip_details' ).append( item + '<br /><br />' );
							} );
						}
						else
						{
							$( '#tips' ).hide();
						}
					}
				});				
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['perk_url'] + $( '#pg_detail' ).data( 'identity' ),
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( perk_info ) 
					{
						$( '#perk_logo' ).attr( 'src', perk_info.logo );
						$( '#perk_tagline' ).text( perk_info.tagline );
						$( '#perk_details' ).text( perk_info.details );
						$( '#perk_validFrom' ).text( perk_info.start_date );
						$( '#perk_validTo' ).text( perk_info.end_date );
						
						//display text based on type of content - html/non-html
						if( ( perk_info.feature & 1 ) > 0 )
						{
							$( '#perk_description' ).html( perk_info.description );
						}
						else
						{
							description = perk_info.description;
							description = description.replace(/\n/g, '<br />');
							$( '#perk_description' ).html( description );
						}
						
						
						if( perk_info.images.length > 0 )
						{
							$.each( perk_info.images, function(i, item) {
								$( '#perk_images' ).append( '<img width="80" src="' + item.image_url + '" /><br />' );
							} );
						}
						else
						{
							$( '#perk_images' ).hide();
						}
						
						//display methods of payment
						if( ( perk_info.pay_methods & 1 ) > 0 )
							$( '#cash' ).show();
						
						if( ( perk_info.pay_methods & 2 ) > 0 )
							$( '#visa' ).show();
							
						if( ( perk_info.pay_methods & 4 ) > 0 )
							$( '#mastercard' ).show();
						
						if( ( perk_info.pay_methods & 8 ) > 0 )
							$( '#amex' ).show();
							
						if( ( perk_info.pay_methods & 16 ) > 0 )
							$( '#other' ).show();
						
						if( ( perk_info.pay_methods & 32 ) > 0 )
							$( '#interac' ).show();
						
						//console.log(perk_info.images[0].image_url);
						//console.log(perk_info.images);
						
						if ( perk_info.favourite == 1 )
						{
							$( '#dlg_favourite' ).data( 'selected', 'true' );

							$( '#dlg_favourite_msg' ).html( 'Would you like to remove "' + perk_info.title + '" to your favourites' );
							
							$( '#pg_detail_favourite' ).find( 'img' ).attr( 'src', 'http://api.venngo.com/start/images/app/favbutton_selected.png' );
						}
						else
						{
							$( '#dlg_favourite' ).data( 'selected', 'false' );

							$( '#dlg_favourite_msg' ).html( 'Would you like to add "' + perk_info.title + '" to your favourites' );
							
							$( '#pg_detail_favourite' ).find( 'img' ).attr( 'src', 'http://api.venngo.com/start/images/app/favbutton.png' );
						}
						
						$( 'div[data-role="footer"] div[data-role="controlgroup"] a:nth-child(2)' ).addClass( 'ui-disabled' );
						
						if ( perk_info.redeem_in_store == 1 )
							$( 'div[data-role="footer"] div[data-role="controlgroup"] a:nth-child(2)' ).removeClass( 'ui-disabled' );
						
						//display methods of redeeming perk
						if( ( perk_info.contact_method & 1 ) > 0 )
							$( '#online' ).show();
						
						if( ( perk_info.contact_method & 2 ) > 0 )
							$( '#phone' ).show();
							
						if( ( perk_info.contact_method & 4 ) > 0 )
						{
							$( '#store' ).show();
							$( '#perk_locate' ).show();
						}
							
							
						if( ( perk_info.contact_method & 16 ) > 0 )
							$( '#email' ).show();
						
						$.mobile.hidePageLoadingMsg();
					}
				});
			}
		);
		
		$( "#pg_detail" ).live(
			'pagehide',
			function( event ) 
			{
				$( '#perk_logo' ).attr( 'src', null );
				$( '#perk_tagline' ).text( null );
				$( '#perk_details' ).text( null );
				$( '#perk_validFrom' ).text( null );
				$( '#perk_validTo' ).text( null );
				$( '#perk_description' ).text( null );
				$( '#perk_images' ).empty();
				$( 'ul#features' ).empty();
				$( 'div#tip_details' ).empty();
			}
		);	
		
		$( '#in_store_redeem' ).live(
				'pagebeforeshow',
				function( event )
				{
					var user_data = check_auth();
			
					if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
						history.back();	

					var authHeader = 'OAuth, auth_token=' + user_data.auth_token
					    + ', public_key=' + app_data['public_key']  
						+ ', public_secret=' + app_data['public_secret'];
						
					$.mobile.showPageLoadingMsg( 
						'b', 
						'Getting Perk Info...'
					);
					
					$( '#lst_redeem' ).empty();
					
					$.ajax({
						type: 'GET',
						url: app_data['api_url'] + app_data['perk_use_url'] + $( '#pg_detail' ).data( 'identity' ) + '/in_store'  + '.json',
						beforeSend: function( xhr )
						{
							xhr.setRequestHeader( "Authorization", authHeader );
						},
						error: function( xhr, status, error )
						{
							if ( xhr.status == 401 )
							{
								$.mobile.changePage( '#dlg_expired' );
							}
						},
						dataType: 'json',
						success: function( redeem_info ) 
						{
							$.mobile.hidePageLoadingMsg();
							
							$( '#in_store_perk_logo' ).attr( 'src', redeem_info.logo );
							
							if( redeem_info.coupon_code )
							{
								$( 'div.perk_tagline' ).text( redeem_info.coupon_code[0] );
								$( 'td#perk_code' ).show();
							}
							else
							{
								$( 'td#perk_code' ).hide();
							}
							
							$( '#in_store_tagline' ).text( $( '#perk_tagline' ).text() );
							$( '#in_store_details' ).text( $( '#perk_details' ).text() );
							
							$.each( redeem_info.instructions.in_store, function(i, item) 
							{
								$( '#in_store_instructions' ).append('<li>' + item + '</li>');
							});
							
							$.each( redeem_info.barcode, function( i, item )
							{
								$( '#in_store_code' ).html('<img src="' + item.barcode_url + '" style="max-width:900px;" width="100%" />');
							});
							
							if( redeem_info.mobile_device )
							{
								if( redeem_info.mobile_device[0] == "1" )
									$( '#in_store_mobile_device' ).show();
							}
						}
					});
				}
			);
		
		$( "#in_store_redeem" ).live(
				'pagehide',
				function( event ) 
				{
					$( 'div.perk_tagline' ).text( null );
					$( '#in_store_perk_logo' ).empty();
					$( '#in_store_tagline' ).text( null );
					$( '#in_store_details' ).text( null );
					$( '#in_store_instructions' ).empty();
					$( '#in_store_code' ).empty();
				}
			);
		
		$( '#online_redeem' ).live(
				'pagebeforeshow',
				function( event )
				{
					var user_data = check_auth();
			
					if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
						history.back();	

					var authHeader = 'OAuth, auth_token=' + user_data.auth_token
					    + ', public_key=' + app_data['public_key']  
						+ ', public_secret=' + app_data['public_secret'];
						
					$.mobile.showPageLoadingMsg( 
						'b', 
						'Getting Perk Info...'
					);
					
					$( '#lst_redeem' ).empty();
					
					$.ajax({
						type: 'GET',
						url: app_data['api_url'] + app_data['perk_use_url'] + $( '#pg_detail' ).data( 'identity' ) + '/online'  + '.json',
						beforeSend: function( xhr )
						{
							xhr.setRequestHeader( "Authorization", authHeader );
						},
						error: function( xhr, status, error )
						{
							if ( xhr.status == 401 )
							{
								$.mobile.changePage( '#dlg_expired' );
							}
						},
						dataType: 'json',
						success: function( redeem_info ) 
						{
							$.mobile.hidePageLoadingMsg();
							
							$( '#online_perk_logo' ).attr( 'src', redeem_info.logo );
							
							if( redeem_info.coupon_code )
							{
								$( 'div.online_perk_code' ).text( redeem_info.coupon_code[0] );
								$( '#online_perk_code' ).show();
							}
							else
							{
								$( '#online_perk_code' ).hide();
							}
							
							$( '#online_perk_tagline' ).text( $( '#perk_tagline' ).text() );
							$( '#online_perk_details' ).text( $( '#perk_details' ).text() );
							
							$.each( redeem_info.instructions.online, function(i, item) 
							{
								$( '#online_instructions' ).append('<li>' + item + '</li>');
							});
							
							$.each( redeem_info.barcode, function( i, item )
							{
								$( '#online_code' ).html('<img src="' + item.barcode_url + '" style="max-width:900px;" width="100%" />');
							});
						}
					});
				}
			);
		
		$( "#online_redeem" ).live(
				'pagehide',
				function( event ) 
				{
					$( 'div.online_perk_code' ).text( null );
					$( '#online_perk_tagline' ).text( null );
					$( '#online_perk_details_details' ).text( null );
					$( '#online_instructions' ).empty();
					$( '#online_perk_logo' ).empty();
					$( '#online_code' ).empty();
				}
			);
		
		$( '#phone_redeem' ).live(
				'pagebeforeshow',
				function( event )
				{
					var user_data = check_auth();
			
					if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
						history.back();	

					var authHeader = 'OAuth, auth_token=' + user_data.auth_token
					    + ', public_key=' + app_data['public_key']  
						+ ', public_secret=' + app_data['public_secret'];
						
					$.mobile.showPageLoadingMsg( 
						'b', 
						'Getting Perk Info...'
					);
					
					$( '#lst_redeem' ).empty();
					
					$.ajax({
						type: 'GET',
						url: app_data['api_url'] + app_data['perk_use_url'] + $( '#pg_detail' ).data( 'identity' ) + '/online'  + '.json',
						beforeSend: function( xhr )
						{
							xhr.setRequestHeader( "Authorization", authHeader );
						},
						error: function( xhr, status, error )
						{
							if ( xhr.status == 401 )
							{
								$.mobile.changePage( '#dlg_expired' );
							}
						},
						dataType: 'json',
						success: function( redeem_info ) 
						{
							$.mobile.hidePageLoadingMsg();
							
							$( '#phone_perk_logo' ).attr( 'src', redeem_info.logo );
							
							if( redeem_info.coupon_code )
							{
								$( 'div.phone_perk_code' ).text( redeem_info.coupon_code[0] );
								$( '#phone_perk_code' ).show();
							}
							else
							{
								$( '#phone_perk_code' ).hide();
							}
							
							$( '#phone_perk_tagline' ).text( $( '#perk_tagline' ).text() );
							$( '#phone_perk_details' ).text( $( '#perk_details' ).text() );
							
							$.each( redeem_info.instructions.telephone, function(i, item) 
							{
								$( '#phone_instructions' ).append('<li>' + item + '</li>');
							});
							
							$.each( redeem_info.barcode, function( i, item )
							{
								$( '#phone_code' ).html('<img src="' + item.barcode_url + '" style="max-width:900px;" width="100%" />');
							});
							
							$( '#phone_link' ).attr( 'href', 'tel:' + redeem_info.phone_number[0] );
							$( '#phone_link' ).text( redeem_info.phone_number[0] );
						}
					});
				}
			);
		
		$( "#phone_redeem" ).live(
				'pagehide',
				function( event ) 
				{
					$( 'div.phone_perk_code' ).text( null );
					$( '#phone_perk_tagline' ).text( null );
					$( '#phone_perk_details_details' ).text( null );
					$( '#phone_instructions' ).empty();
					$( '#phone_perk_logo' ).empty();
					$( '#phone_code' ).empty();
					$( '#phone_link' ).empty();
				}
			);
		
		$( '#email_redeem' ).live(
				'pagebeforeshow',
				function( event )
				{
					var user_data = check_auth();
			
					if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
						history.back();	

					var authHeader = 'OAuth, auth_token=' + user_data.auth_token
					    + ', public_key=' + app_data['public_key']  
						+ ', public_secret=' + app_data['public_secret'];
						
					$.mobile.showPageLoadingMsg( 
						'b', 
						'Getting Perk Info...'
					);
					
					$( '#lst_redeem' ).empty();
					
					$.ajax({
						type: 'GET',
						url: app_data['api_url'] + app_data['perk_use_url'] + $( '#pg_detail' ).data( 'identity' ) + '/online'  + '.json',
						beforeSend: function( xhr )
						{
							xhr.setRequestHeader( "Authorization", authHeader );
						},
						error: function( xhr, status, error )
						{
							if ( xhr.status == 401 )
							{
								$.mobile.changePage( '#dlg_expired' );
							}
						},
						dataType: 'json',
						success: function( redeem_info ) 
						{
							$.mobile.hidePageLoadingMsg();
							
							$( '#email_perk_logo' ).attr( 'src', redeem_info.logo );
							
							if( redeem_info.coupon_code )
							{
								$( 'div.email_perk_code' ).text( redeem_info.coupon_code[0] );
								$( '#email_perk_code' ).show();
							}
							else
							{
								$( '#email_perk_code' ).hide();
							}
							
							$( '#email_perk_tagline' ).text( $( '#perk_tagline' ).text() );
							$( '#email_perk_details' ).text( $( '#perk_details' ).text() );
							
							$.each( redeem_info.instructions.email, function(i, item) 
							{
								$( '#email_instructions' ).append('<li>' + item + '</li>');
							});
							
							$.each( redeem_info.barcode, function( i, item )
							{
								$( '#email_code' ).html('<img src="' + item.barcode_url + '" style="max-width:900px;" width="100%" />');
							});
							
							$( '#email_link' ).attr( 'href', 'mailto:' + redeem_info.email[0] );
							$( '#email_link' ).text( redeem_info.email[0] );
						}
					});
				}
			);
		
		$( "#email_redeem" ).live(
				'pagehide',
				function( event ) 
				{
					$( 'div.email_perk_code' ).text( null );
					$( '#email_perk_tagline' ).text( null );
					$( '#email_perk_details_details' ).text( null );
					$( '#email_instructions' ).empty();
					$( '#email_perk_logo' ).empty();
					$( '#email_code' ).empty();
					$( '#email_link' ).empty();
				}
			);
		
		$( '#pg_use' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
		
				if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
					history.back();	

				$( '#pg_use_title' ).text( $( '#pg_detail_title' ).text() );
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Perk Info...'
				);
				
				$( '#lst_redeem' ).empty();
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['perk_use_url'] + $( '#pg_detail' ).data( 'identity' ) + '/',
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( perk_info ) 
					{
						for ( redemption_type in perk_info.redemptions )
							switch( redemption_type )
							{
						case 'in_store':
					 		$( '#lst_redeem' ).append( '<li><a href="#pg_redeem" data-identity="in_store"><img src="http://api.venngo.com/start/images/app/icon_mobile_instore.png" /> in store</a></li>' );
					 	break;
					 	
					 	case 'by_email':
					 		$( '#lst_redeem' ).append( '<li><a href="#pg_redeem" data-identity="by_email"><img src="http://api.venngo.com/start/images/app/icon_mobile_email.png" /> by email</a></li>' );
					 	break;

					 	case 'by_phone':
					 		$( '#lst_redeem' ).append( '<li><a href="#pg_redeem" data-identity="by_phone"><img src="http://api.venngo.com/start/images/app/icon_mobile_phone.png" /> by phone</a></li>' );
					 	break;

					 	case 'online':
					 		$( '#lst_redeem' ).append( '<li><a href="#pg_redeem" data-identity="online"><img src="http://api.venngo.com/start/images/app/icon_mobile_online.png" /> online</a></li>' );
					 	break;
							 }
							 
					 		$( '#lst_redeem' ).append( '<li><a href="#pg_perkTerms">perk terms and conditions</a></li>' );
					 		
						$( "#lst_redeem" ).listview( "refresh" );
					}
				});
			}
		);
		
		$( '#pg_locate' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
								
				if ( $( '#pg_detail' ).data( 'identity' ) == undefined )
					history.back();	
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$( '#pg_locate_title' ).text( $( '#pg_detail_title' ).text() );

				$( '#map_perk' ).height( $( document ).height() - $( '#map_canvas' ).position().top - 30 );

				var map = new google.maps.Map(
					document.getElementById("map_perk"),
					{
						center: new google.maps.LatLng( user_data.location_latitude, user_data.location_longitude ),
						mapTypeId: google.maps.MapTypeId.ROADMAP,
						zoom: 12
					}
				);

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng( user_data.location_latitude, user_data.location_longitude ),
					map: map
				});
				
				google.maps.event.trigger(map, 'resize');
				
				$.ajax({
					type: 'POST',
					url: app_data['api_url'] + app_data['perk_location_url'] + $( '#pg_detail' ).data( 'identity' ) + '/',
					data: {
		    			longitude: user_data.location_longitude,
						latitude: user_data.location_latitude,
						range: user_data.location_range
		    		},
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( data ) 
					{
						$.each(
							data, 
							function ( index, perk ) 
							{
								var marker = new google.maps.Marker({
  									position: new google.maps.LatLng( perk.latitude, perk.longitude ),
  									map: map,
  									title: '<div style="float: left;"><a href="#pg_detail"><img src="' + perk.logo + '" /></a></div><div style="float: right;"><a href="#pg_detail">' + perk.address_1 + ', ' + perk.prov + '</a></div>'
								});
								
								google.maps.event.addListener(
									marker, 
									'click', 
									function( event )
									{
										var infowindow = new google.maps.InfoWindow({
    											content: '<div style="float: left;"><a href="#pg_detail"><img src="' + perk.logo + '" /></a></div><div style="float: right;"><a href="#pg_detail">' + perk.address_1 + ', ' + perk.prov + '</a></div>'
										});
										
										infowindow.open( map, marker );
									}
								);
	        				}
	        			);

						$.mobile.hidePageLoadingMsg();
					}
				});
			}
		);
		
/*		$( '#pg_more' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
				
				$( '#pg_more_title' ).text( $( '#pg_detail_title' ).text() );

				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Perk Details...'
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['perk_more_url'] + $( '#pg_detail' ).data( 'identity' ) + '.html',
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( more_html ) 
					{
						$( '#pg_more_content' ).html( more_html );
					}
				});
			}
		); */
		
		$( '#pg_perkTerms' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Perk Terms...'
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['perk_terms_url'] + $( '#pg_detail' ).data( 'identity' ) + '.html',
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( term_html ) 
					{
						$( '#pg_perkTerms_content' ).html( term_html );
					}
				});
			}
		);
		
		$( '#pg_favourite' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Favourites...'
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['favourites_url'] + '0/',
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					dataType: 'json',
					success: function( data ) 
					{
						$('#lst_favourite').empty();
						
						$.each( 
							data,
							function( index, perk )
							{
								if ( perk.id )
									$( '#lst_favourite' ).append( '<li data-identity="' + perk.perk_id + '"><a href="#pg_detail"><img src="http://api.venngo.com/start/images/app/favicon.png" /><h3>' + perk.title + '</h3></a></li>' );
								else
									$( '#lst_favourite' ).append( '<li><h3>' + perk + '</h3></li>' );
							}
						);
						
						$( "#lst_favourite" ).listview( "refresh" );
						
						$( '#lst_favourite li' ).click(
							function( event )
							{
								$( '#pg_detail' ).data( 'identity', $( this ).data( "identity" ) );
								
								$( '#pg_detail_title' ).text( $( this ).find( 'h3' ).text() );
							}
						);
						
						$.mobile.hidePageLoadingMsg();
					}
				});		
			}
		);
		
		$( '#pg_settings' ).live(
			'pageinit',
			function( event )
			{
				$ ( '#pg_settings_logout' ).click(
					function( event )
					{
						localStorage.removeItem( "user_data" );
					}
				);
			}
		);
		
		$( '#pg_location' ).live(
			'pagebeforeshow',
			function( event )
			{
				var user_data = check_auth();
				
				$('#pg_location_items').text(user_data);
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Locations...'
				);
				
				$( 'input[name="radio-choice-2"]:radio' ).each(
					function( index, choice )
					{
						if ( user_data.location_range == $( choice ).val() )
							 $( choice ).attr( 'checked', 'true' ).checkboxradio("refresh");
					}
				);
				
				$( 'input[name="radio-choice-2"]:radio' ).change(
					function( event )
					{
						user_data.location_range = $( this ).val();
						 
						localStorage.setItem( 'user_data', JSON.stringify( user_data ) );
					}
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['locations_url'],
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( data ) 
					{  
						var check_this = '';
						
						$( '#pg_location_items' ).empty();
						
						if ( navigator.geolocation )
						{
							if ( user_data.location_label == 'GPS' )
								check_this = 'checked="true" ';

							$( '#pg_location_items' ).append( '<input type="radio" ' + check_this + 'name="radio-choice-1" id="location_gps" value="" /> <label for="location_gps">GPS</label>' );
						}
							
						$( '#pg_location_items' ).append( '<legend>location:</legend>' );
						
						$.each( 
							data,
							function( index, location )
							{
								check_this = '';
								
								if ( user_data.location_label == location.label )
									check_this = 'checked="true" ';
									
								$( '#pg_location_items' ).append( '<input type="radio" ' + check_this + 'name="radio-choice-1" id="location_' + index +'" value="' + index +'" /> <label for="location_' + index +'">' + location.label + '</label>' );
							}
						);

						$( 'input[name="radio-choice-1"]:radio' ).change(
							function( event )
							{
								if ( $( this ).val() == '' )
								{
									$.mobile.showPageLoadingMsg( 
										'b', 
										'Getting Position...'
									);
									
				  					navigator.geolocation.getCurrentPosition(
				    					function( position )
				    					{
											user_data.location_label = 'GPS';
											user_data.location_latitude = position.coords.latitude;
											user_data.location_longitude = position.coords.longitude;

											$.mobile.hidePageLoadingMsg();
										}
									);
								}
								else
								{
									user_data.location_label = data[$( this ).val()].label;
									user_data.location_latitude = data[$( this ).val()].latitude;
									user_data.location_longitude = data[$( this ).val()].longitude;
								}
								
								localStorage.setItem( 'user_data', JSON.stringify( user_data ) );
							}
						);
						
						$( "#pg_location" ).trigger( "create" );
						
						$.mobile.hidePageLoadingMsg();
					}
				});	
			}
		);
		
		$( '#pg_terms' ).live(
			'pageinit',
			function( event )
			{
				var user_data = check_auth();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Venngo Terms...'
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['terms_url'],
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( data ) 
					{
						$( '#pg_terms_content' ).html( data );
						
						$.mobile.hidePageLoadingMsg();
					}
				});		
			}
		);

		$( '#pg_privacy' ).live(
			'pageinit',
			function( event )
			{
				var user_data = check_auth();
				
				var authHeader = 'OAuth, auth_token=' + user_data.auth_token
				    + ', public_key=' + app_data['public_key']  
					+ ', public_secret=' + app_data['public_secret'];
					
				$.mobile.showPageLoadingMsg( 
					'b', 
					'Getting Privacy Policy...'
				);
				
				$.ajax({
					type: 'GET',
					url: app_data['api_url'] + app_data['privacy_url'],
					beforeSend: function( xhr )
					{
						xhr.setRequestHeader( "Authorization", authHeader );
					},
					error: function( xhr, status, error )
					{
						if ( xhr.status == 401 )
						{
							$.mobile.changePage( '#dlg_expired' );
						}
					},
					success: function( data ) 
					{
						$( '#pg_privacy_content' ).html( data );
						
						$.mobile.hidePageLoadingMsg();
					}
				});		
			}
		);

		$( '#dlg_favourite' ).live(
			'pageinit',
			function( event )
			{
				var user_data = check_auth();

				$( '#favourite_yes' ).click(
					function( event )
					{
						var authHeader = 'OAuth, auth_token=' + user_data.auth_token
						    + ', public_key=' + app_data['public_key']  
							+ ', public_secret=' + app_data['public_secret'];

						$.ajax({
							type: 'POST',
							url: app_data['api_url'] + app_data['favourite_perk_url'] + $( '#pg_detail' ).data( 'identity' ) + '/',
							beforeSend: function( xhr )
							{
								xhr.setRequestHeader( "Authorization", authHeader );
							},
							error: function( xhr, status, error )
							{
								if ( xhr.status == 401 )
								{
									$.mobile.changePage( '#dlg_expired' );
								}
							},
							success: function( term_html ) 
							{
								if ( $( '#dlg_favourite' ).data( 'selected' ) == 'true' )
								{
									$( '#dlg_favourite' ).data( 'selected', 'false' );

									$( '#pg_detail_favourite' ).find( 'img' ).attr( 'src', 'http://api.venngo.com/start/images/app/favbutton.png' );
								}
								else
								{
									$( '#dlg_favourite' ).data( 'selected', 'true' );

									$( '#pg_detail_favourite' ).find( 'img' ).attr( 'src', 'http://api.venngo.com/start/images/app/favbutton_selected.png' );
								}
								
								$( '.ui-dialog' ).dialog( 'close' );
							}
						});
					}
				);

				$( '#favourite_no' ).click(
					function( event )
					{
						$( '.ui-dialog' ).dialog( 'close' );
					}
				);
			}
		);
		
		$( '#dlg_favourite' ).live(
			'pagebeforeshow',
			function( event )
			{
				$( '#dlg_favourite_title' ).text( $( '#pg_detail_title' ).text() );
			}
		);
		
		$( '#dlg_expired' ).live(
			'pagebeforeshow',
			function( event )
			{
				$( '#expired_continue' ).click(
					function( event )
					{
						$( '.ui-dialog' ).dialog( 'close' );
						
						$.mobile.changePage( $( '#pg_login' ) );
					}
				);
			}
		);		
