---
layout: post
title: "Running OCUnit (or Specta) Tests from Command Line"
location: Singapore
---

OCUnit (SenTestingKit) and test frameworks built on top of OCUnit such
as [Specta](https://github.com/petejkim/specta) and
[Kiwi](https://github.com/allending/Kiwi) are tightly integrated
with Xcode and it is super easy to set up and run tests within the IDE.
However, getting it to run from the command line (for example, to
automate testing in continuous integration servers) is not quite as
straight forward. As far as I know, there is no official support from
Apple for running tests from the command line, but it _can_ be done.

This guide assumes the latest version of Mac OS X and Xcode at the time
of writing, which is 10.7.3 and 4.3.2 respectively.

### Running Tests for Mac OS X Projects

Running tests for Mac OS X projects is actually fairly simple with the
use of `xcodebuild` command line tool. The following command cleans,
builds, and then runs the tests for the `MyApp` scheme in your Xcode
project.

{% highlight text %}
xcodebuild -scheme MyApp clean test
{% endhighlight %}

Omit `clean` if you do not want to rebuild the entire codebase.

If your project is contained inside a Xcode workspace, you can specify
the workspace with a `-workspace` option. You probably want to do this
if you use [CocoaPods](https://github.com/CocoaPods/CocoaPods).

{% highlight text %}
xcodebuild -workspace MyApp.xcworkspace -scheme MyApp clean test
{% endhighlight %}

Note that the return code of the tests will always be 0 regardless of
whether the test succeeds or fails, so you will have to detect the
presence of `** TEST SUCCEEDED **` text in the output.

### Running Tests for iOS Projects

You would naturally assume that you can use the same command for iOS
projects, but in reality, that is unfortunately not the case. The
command, when run, will will fail with the following error message:

{% highlight text %}
xcodebuild: error: Failed to build workspace MyApp with scheme MyApp.
        Reason: The run destination My Mac 64-bit is not valid for
Testing the scheme 'MyApp'.
{% endhighlight %}

The run destination should be &ldquo;iPhone Simulator&rdquo; and not
&ldquo;My Mac 64-bit&rdquo;, but I could not figure out how to get
`xcodebuild` to use the correct run destination.

According to an Apple employee at
[Apple Developer Forums](https://devforums.apple.com/), `xcodebuild`
in Xcode 4 does not support unit testing iOS targets yet. It is not
entirely true though, as it _is_ actually possible to run test with 
`xcodebuild`, albeit requiring some extra steps.

The first step is to create a new Scheme for your test target. This lets
you use `build` action instead of `test` action to run your tests.

![New Scheme...](/uploads/2012-03-28-new-scheme.png)

Make sure you choose the test bundle target and not your app, and then
click &ldquo;OK&rdquo;.

![Test Target](/uploads/2012-03-28-new-scheme-test-target.png)

Once the new scheme is created, navigate to &ldquo;Product&rdquo; &rarr;
&ldquo;Edit Scheme...&rdquo; and have the checkbox for &ldquo;Run&rdquo;
that belongs to the test target checked, then click &ldquo;OK&rdquo;

![Run Checkbox](/uploads/2012-03-28-new-scheme-test-target-run-checkbox.png)

Now, open up the target configuration screen, select the test target,
select &ldquo;Build Phases&rdquo; tab, and make sure that the &ldquo;Run
Script&rdquo; phase is the last item in the list. You can also uncheck
&ldquo;Show environment variables in build log&rdquo; to reduce garbage
that gets printed out when you run `xcodebuild`.

![Build Phases - Run Script](/uploads/2012-03-28-build-phases-run-script.png)

You can then attempt to run the tests via the newly created scheme,
using the following command (add the `-workspace` option if needed):

{% highlight text %}
killall -m -KILL "iPhone Simulator"
xcodebuild -scheme MyAppTests -sdk iphonesimulator TEST_AFTER_BUILD=YES clean build
{% endhighlight %}

You will then see that even though the build has succeeded, the test has
failed to run with the following error message:

{% highlight text %}
/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Tools/Tools/RunPlatformUnitTests:95: warning: Skipping tests; the iPhoneSimulator platform does not currently support application-hosted tests (TEST_HOST set).
{% endhighlight %}

The error message claims that the iPhoneSimulator platform does not
currently support applicated-hosted tests, but how can it be true
considering how they run so perfectly under Xcode? Well, turns out,
this is because the shell script that is getting invoked is outdated,
and this can easily be 
[patched](http://longweekendmobile.com/2011/04/17/xcode4-running-application-tests-from-the-command-line-in-ios/).

First, open the file that is causing the error in your favorite text
editor (it requires sudo access):

{% highlight text %}
sudo vim `xcode-select -print-path`/Platforms/iPhoneSimulator.platform/Developer/Tools/RunPlatformUnitTests
{% endhighlight %}

And change line 95 from:

{% highlight text %}
Warning ${LINENO} "Skipping tests; the iPhoneSimulator platform does not currently support application-hosted tests (TEST_HOST set)."
{% endhighlight %}

to the following:

{% highlight text %}
export CFFIXED_USER_HOME="${BUILT_PRODUCTS_DIR}/UserHome/"
mkdir -p "${CFFIXED_USER_HOME}"
mkdir -p "${CFFIXED_USER_HOME}/Library/Caches"
mkdir "${CFFIXED_USER_HOME}/Library/Preferences"
mkdir "${CFFIXED_USER_HOME}/Documents"
export OTHER_TEST_FLAGS="${OTHER_TEST_FLAGS} -RegisterForSystemEvents"
RunTestsForApplication "${TEST_HOST}" "${TEST_BUNDLE_PATH}"
{% endhighlight %}

You might have to repeat the above step when Xcode is reinstalled or
upgraded. Once the edit is done, save and try running the tests (again,
add `-workspace` option if needed):

{% highlight text %}
killall -m -KILL "iPhone Simulator"
xcodebuild -scheme MyAppTests -sdk iphonesimulator TEST_AFTER_BUILD=YES clean build
{% endhighlight %}

Voil&agrave;! The tests should have run. The output text will contain a
lot of garbage, including something that goes along the lines of
&ldquo;Preceding build task claims to succeed in spite of generating
error messages. Please file a bug report.&rdquo;, but that message can
be safely ignored.

The command above also appears to generate non-zero return code when the
test fails, but it might be more reliable to detect the presence of `**
BUILD SUCCEEDED **` text in the output.

### JUnit XML Output

If you use [Jenkins CI](http://jenkins-ci.org/), you may wanna check out 
[OCUnit2JUnit](https://github.com/ciryon/OCUnit2JUnit), which converts
the output format of OCUnit to the XML format used by JUnit.

### Good Luck!

Although it takes many steps to get specs running, once set up, it works
pretty well. It would be really cool if Apple gets around to fixing
`xcodebuild` command line tool to run tests for iOS projects out of the
box, but the bug has been around for quite some time, so don&rsquo;t get
your hopes up. Filing a bug report in Apple&rsquo;s
[Radar](https://bugreport.apple.com/) will really help though. Good
luck!

