
# Request for data collection review form

**All questions are mandatory. You must receive review from a data steward peer on your responses to these questions before shipping new data collection.**

1) What questions will you answer with this data?

We would like to know the necessary bandwidth and connections necessary to proxy Firefox content.  We break the content down into categories to see what type of bandwidth it would take for different types.

2) Why does Mozilla need to answer these questions?  Are there benefits for users? Do we need this information to address product or business requirements? Some example responses:

To improve user privacy by proxying trackers or private mode traffic to anonymize user IP address.

* Establish baselines or measure changes in product or platform quality or performance.

* Provide information essential for advancing a business objective such as supporting OKRs.

* Determine whether a product or platform change has an effect on user or browser behavior.

3) What alternative methods did you consider to answer these questions? Why were they not sufficient?

There’s no good way to estimate current usage/distributions of tracking resources for all Firefox users.  We could have run an experiment that collected this information for a subset of users, but it would be very costly and doesn’t scale over time.

4) Can current instrumentation answer these questions?

No, there’s no statistical data about how much data is transferred and their related categories, such as tracker or fingerprinting information.

5) List all proposed measurements and indicate the category of data collection for each measurement, using the Firefox [data collection categories](https://wiki.mozilla.org/Firefox/Data_Collection) on the Mozilla wiki.

**Note that the data steward reviewing your request will characterize your data collection based on the highest (and most sensitive) category.**

<table>
  <tr>
    <td>Measurement Description</td>
    <td>Data Collection Category</td>
    <td>Tracking Bug #</td>
  </tr>
  <tr>
    <td>Total number of HTTP transactions, connections, and transferred bytes</td>
    <td>Category 3 (Web activity data)</td>
    <td>Bug 1533363</td>
  </tr>
</table>


6) How long will this data be collected?  Choose one of the following:

I want this data to be collected for 6 months initially.

* This is scoped to a time-limited experiment/project until date MM-DD-YYYY.

* I want this data to be collected for 6 months initially (potentially renewable).

* I want to permanently monitor this data. (put someone’s name here)

7) What populations will you measure?

* Which release channels?
All

* Which countries?
All

* Which locales?
All

* Any other filters?  Please describe in detail below.
No

8) If this data collection is default on, what is the opt-out mechanism for users?

Stander opt-out mechanism, like turning Telemetry off.

9) Please provide a general description of how you will analyze this data.

We will look at the different categories and how much bandwidth they take.  We will use this to see if it is realistic for us to proxy some traffic.

10) Where do you intend to share the results of your analysis?

Internally with engineering, and later with product.

11) Is there a third-party tool (i.e. not Telemetry) that you are proposing to use for this data collection? If so:

No

* Are you using that on the Mozilla backend? Or going directly to the third-party?
