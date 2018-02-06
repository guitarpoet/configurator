# Better way to handle configuration

## The Configuration Problems

Configuration is a very foundation part of the application. It seems all applications today will need configuration of some kind.

Let's take an server application as an example, at least you need:

1. The configuration for the storage service(say, relational database, or some kind of NoSQL database) 
2. The configuration for the framework(say the paths for the views, the basic configurations for the controllers)
3. The configuration for the routing(yes, I prefer the routing should use a auto load configuration way)

And if you have the difference of the development and production environments, you have at least 2 set of configurations(and some of them are same)

## The Solution

And the Configurator is the solution for that, the functions that Configurator provides is:

1. Use YAML syntax for the configuration: This will make the configuration file much more concise and nice to writing and reading. And it will support the references and comments, which is much better than JSON format
2. Use a macro engine to preprocess the configuration before loading: Use a macro engine filter the configuration is better than duplicate your configuration into multiple files, and load the configuration  according to the environment(say `process.env`), besides, the macro engine the Configurator provides will support include too(which will use the node's require resolver to resolve the file, so that you can just resolve the file using the macro just as you resolve the js file in the nodejs)
3. Adding the alias and composite syntax into the YAML, so that you can use them to make your configuration much readable: Most of the time, the configuration is just like a hierarchy tree of objects, so if you want to standardize your configuration, you'll find you must introduce some kind of the clutter all the time, something like this `{ filters: { filterA: { config: { initArgs: { debug: true } } } } }`, which will be much better if you can write something like this { "^filters/filterA/config/initArgs/debug": true }
4. Added the base template support for the configuration items: Most of the time, you'll find most of the configuration of the same kind will have same base configurations, there are lots of examples for this(mostly the configuration heavy projects), from Spring to Hibernate. They will provides a base/abstract configuration template feature, to let you setup the base configuration item, and let you override the default values
5. Use the object instead of pure hash objects: You should load the configurations as object instead of pure hash, since the object will has much rich feature which let you treat your data better, and add sane defaults by your class definition. Besides, it will have better validation method and split the complex logic of the whole configuration file into objects

And how this will improve your configuration? Let's take one example here.

## The example

Let's take this configuration as an example(this is a simple made up example for routing)

```YAML
routes:
    /: # The home route
        type: express # This route is using express as the routing process engine
        module: routes/main # The module that this routing process method is
        name: home # The method of this routing processing, it should be a function can be access through require("route/main").home
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
    /about: # The about route
        type: static # This is just a route for the static page, but still need processed in the filter chain
        file: static/pages/about.html
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
    /contact: # The about route
        type: static # This is just a route for the static page, but still need processed in the filter chain
        file: static/pages/contact.html
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
    /login: # The dashboard
        type: express
        module: routes/user
        name: login
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
    /dashboard: # The dashboard
        type: express
        module: routes/main
        name: dashboard
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
                -
                    type: module 
                    module: filters
                    name: login_check
```

You can see, only 5 routes(and not quite complex) configured, we already have 65 lines now, and it is YAML, if you are using JSON, it will be much complex than this(not even thinking about the DEBUG and PRODUCTION)

So the configurator come to the rescure, with the configurator's alias, base and other features, the configuration can turn to this:

```YAML
templates:
    cache-filter: &cache-filter
        $type: module
        $module: filters
        $name: cache_check
    record-visit-filter: &record-visit-filter
        $type: module
        $module: filters
        $name: cache_check
    login-filter: &login-filter
        $type: module
        $module: filters
        $name: login_check
    base-static-page:
        type: static
        config:
            filters:
                -
                    $base: *record-visit-filter
                -
                    $base: *record-visit-filter
routes:
    /: # The home route
        type: express # This route is using express as the routing process engine
        module: routes/main # The module that this routing process method is
        name: home # The method of this routing processing, it should be a function can be access through require("route/main").home
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
    /about: # The about route
        type: static # This is just a route for the static page, but still need processed in the filter chain
        file: static/pages/about.html
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
    /contact: # The about route
        type: static # This is just a route for the static page, but still need processed in the filter chain
        file: static/pages/contact.html
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
    /login: # The dashboard
        type: express
        module: routes/user
        name: login
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
    /dashboard: # The dashboard
        type: express
        module: routes/main
        name: dashboard
        config: # The configuration for the route node
            filters: # The filter chain configuartion for this controller
                -
                    type: module # This will indicate this module is loaded using nodejs
                    module: filters
                    name: record_visit
                -
                    type: module 
                    module: filters
                    name: cache_check
                -
                    type: module 
                    module: filters
                    name: login_check
```
