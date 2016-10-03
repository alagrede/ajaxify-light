<#import "/spring.ftl" as spring>

<@layout.extends name="layout/base.ftl">

	<#-- Title -->
   	<@layout.put block="title" type="replace">
       <title>Demo page</title>
    </@layout.put>

	<#-- Head -->
    <@layout.put block="head" type="append">
	</@layout.put>

	<#-- Content -->
	<@layout.put block="contents">
		<h1 class="text-center">Ajaxify Demo</h1>
		
	</@layout.put>
	
	
</@layout.extends>