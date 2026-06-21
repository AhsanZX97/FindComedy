Feature: Browse page loading and error states

  @regression
  Scenario: Listings fail to load
    Given the listings service is unavailable
    When I open the browse page
    Then I should see an error message instead of listings

  @regression
  Scenario: No listings exist yet
    Given there are no listings
    When I open the browse page
    Then I should see a message that no nights match my filters
